
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

export default function CallRoom({
  peerId,
  peerName,
  kind,
}: {
  peerId: string;
  peerName: string;
  kind: Kind;
}) {
  const router = useRouter();

  const [state, setState] = useState<ScreenState>('starting');
  const [call, setCall] = useState<CallData | null>(null);
  const [token, setToken] = useState('');
  const [wsUrl, setWsUrl] = useState('');
  const [maxSeconds, setMaxSeconds] = useState(0);
  const [error, setError] = useState('');

  const startedRef = useRef(false);
  const endingRef = useRef(false);
  const connectedAtRef = useRef<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const finishCall = useCallback(async () => {
    if (endingRef.current) return;

    endingRef.current = true;
    stopPolling();
    setState('ending');

    try {
      if (call?.callId) {
        await fetch('/api/calls/end', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          keepalive: true,
          body: JSON.stringify({
            callId: call.callId,
          }),
        });
      }
    } catch (err) {
      console.error('[CallRoom] End call error:', err);
    } finally {
      setState('ended');
      setTimeout(() => router.back(), 1000);
    }
  }, [call?.callId, router, stopPolling]);

  // Start call and create CallSession.
  useEffect(() => {
    if (startedRef.current) return;

    startedRef.current = true;
    let active = true;

    const startCall = async () => {
      try {
        const response = await fetch('/api/calls/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            peerUserId: peerId,
            kind,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success || !data.call?.callId) {
          throw new Error(data.error || 'Unable to start call');
        }

        if (!active) return;

        setCall({
          callId: data.call.callId,
          status: data.call.status,
          kind: data.call.kind,
        });

        setState('ringing');
      } catch (err: any) {
        if (!active) return;

        setError(err?.message || 'Unable to start call');
        setState('error');
      }
    };

    startCall();

    return () => {
      active = false;
    };
  }, [peerId, kind]);

  // Poll call status until accepted or ended.
  useEffect(() => {
    if (!call?.callId || state !== 'ringing') return;

    let active = true;
    let checking = false;

    const checkStatus = async () => {
      if (checking || endingRef.current) return;

      checking = true;

      try {
        const response = await fetch(
          `/api/calls/status?callId=${encodeURIComponent(call.callId)}`,
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Unable to check call');
        }

        if (!active) return;

        const status: CallStatus = data.call.status;

        if (status === 'accepted') {
          stopPolling();
          setState('connecting');
          return;
        }

        if (
          ['rejected', 'busy', 'cancelled', 'missed', 'ended', 'failed'].includes(status)
        ) {
          stopPolling();
          endingRef.current = true;
          setState('ended');
          setTimeout(() => router.back(), 1400);
        }
      } catch (err) {
        console.error('[CallRoom] Status check error:', err);
      } finally {
        checking = false;
      }
    };

    checkStatus();

    pollRef.current = setInterval(checkStatus, 1500);

    return () => {
      active = false;
      stopPolling();
    };
  }, [call?.callId, state, router, stopPolling]);

  // Only request LiveKit token after the receiver accepts.
  useEffect(() => {
    if (!call?.callId || state !== 'connecting') return;

    let active = true;

    const connectToLiveKit = async () => {
      try {
        const response = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            callId: call.callId,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success || !data.token || !data.wsUrl) {
          throw new Error(data.error || 'Unable to connect to call');
        }

        if (!active) return;

        setToken(data.token);
        setWsUrl(data.wsUrl);
        setMaxSeconds(Number(data.maxSeconds) || 0);
        connectedAtRef.current = Date.now();
        setState('ready');
      } catch (err: any) {
        if (!active) return;

        setError(err?.message || 'LiveKit connection failed');
        setState('error');

        // Mark this call as failed/ended on the server.
        try {
          await fetch('/api/calls/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ callId: call.callId }),
          });
        } catch {
          // No additional action.
        }
      }
    };

    connectToLiveKit();

    return () => {
      active = false;
    };
  }, [call?.callId, state]);

  // Cancel or end call.
  const handleEnd = () => {
    void finishCall();
  };

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
          ? 'Calling… Waiting for answer'
          : state === 'connecting'
            ? 'Connecting securely…'
            : 'Ending call…';

    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
        <div className="h-28 w-28 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-3xl font-bold">
          {peerName.slice(0, 2).toUpperCase()}
        </div>

        <p className="text-xl font-semibold">{peerName}</p>

        <p className="text-sm text-slate-400">{label}</p>

        {state === 'ringing' && (
          <div className="flex gap-1 mt-1">
            {[0, 1, 2].map((item) => (
              <span
                key={item}
                className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"
                style={{ animationDelay: `${item * 200}ms` }}
              />
            ))}
          </div>
        )}

        <button
          onClick={handleEnd}
          className="mt-8 h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
          aria-label="Cancel call"
        >
          <PhoneXMarkIcon className="h-7 w-7" />
        </button>

        <p className="text-xs text-slate-500">Cancel call</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-slate-950 text-white gap-4 p-6 text-center">
        <p className="text-red-400 text-lg font-semibold">Call failed</p>
        <p className="text-sm text-slate-400">{error}</p>

        <button
          onClick={handleEnd}
          className="px-6 py-3 rounded-full bg-slate-700"
        >
          Go back
        </button>
      </div>
    );
  }

  if (state === 'ended') {
    return (
      <div className="h-dvh flex items-center justify-center bg-slate-950 text-white">
        Call ended
      </div>
    );
  }

  if (state === 'ready' && token && wsUrl && call) {
    return (
      <LiveKitRoom
        token={token}
        serverUrl={wsUrl}
        connect
        audio
        video={kind === 'video'}
        onDisconnected={() => {
          void finishCall();
        }}
        onError={(err) => {
          console.error('[LiveKit]', err);
          void finishCall();
        }}
        style={{ height: '100dvh' }}
      >
        <RoomAudioRenderer />

        <CallInner
          kind={kind}
          peerName={peerName}
          maxSeconds={maxSeconds}
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
  onEnd,
}: {
  kind: Kind;
  peerName: string;
  maxSeconds: number;
  onEnd: () => void;
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

  const [elapsed, setElapsed] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(kind === 'video');

  const endedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((value) => value + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (maxSeconds > 0 && elapsed >= maxSeconds && !endedRef.current) {
      endedRef.current = true;
      onEnd();
      room.disconnect();
    }
  }, [elapsed, maxSeconds, onEnd, room]);

  const toggleMic = async () => {
    try {
      const next = !micOn;
      await localParticipant.setMicrophoneEnabled(next);
      setMicOn(next);
    } catch (error) {
      console.error('[CallRoom] Microphone error:', error);
    }
  };

  const toggleCam = async () => {
    try {
      const next = !camOn;
      await localParticipant.setCameraEnabled(next);
      setCamOn(next);
    } catch (error) {
      console.error('[CallRoom] Camera error:', error);
    }
  };

  const formatTime = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
      seconds % 60
    ).padStart(2, '0')}`;

  const remaining =
    maxSeconds > 0 ? Math.max(0, maxSeconds - elapsed) : null;

  return (
    <div className="relative h-dvh bg-slate-950">
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur text-white px-4 py-2 rounded-full text-xs sm:text-sm flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="font-semibold">{peerName}</span>
        <span className="text-slate-400">•</span>
        <span className="tabular-nums">{formatTime(elapsed)}</span>

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

          <p className="text-xl font-semibold">{peerName}</p>

          <p className="text-sm text-slate-400 tabular-nums">
            {formatTime(elapsed)}
          </p>
        </div>
      )}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        <button
          onClick={toggleMic}
          className={`h-14 w-14 rounded-full flex items-center justify-center text-white ${
            micOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600'
          }`}
          aria-label="Toggle microphone"
        >
          <MicrophoneIcon className="h-6 w-6" />
        </button>

        {kind === 'video' && (
          <button
            onClick={toggleCam}
            className={`h-14 w-14 rounded-full flex items-center justify-center text-white ${
              camOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600'
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
