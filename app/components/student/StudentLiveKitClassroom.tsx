'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Room,
  RoomEvent,
  ConnectionState,
  Track,
  createLocalTracks,
  type LocalTrack,
  type RemoteParticipant,
  type RemoteTrack,
  type Participant,
} from 'livekit-client';

import {
  Play,
  PhoneOff,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Video,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Wifi,
  Radio,
  User as UserIcon,
  BookOpen,
  Sparkles,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  MonitorOff,
  ShieldCheck,
  Headphones,
  UserCircle2,
  Volume2,
  MessageSquare,
} from 'lucide-react';

/* ============================================================
   Types
   ============================================================ */

type Props = {
  assignmentId: string;
  roomName: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  teacherName: string;
};

type ParticipantInfo = {
  identity: string;
  name: string;
  isLocal: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  isSpeaking: boolean;
};

/* ============================================================
   Component
   ============================================================ */

export default function StudentLiveKitClassroom({
  assignmentId,
  roomName,
  studentName,
  studentEmail,
  courseName,
  teacherName,
}: Props) {
  /* ---------- Connection state ---------- */
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'started' | 'error'
  >('idle');
  const [message, setMessage] = useState(
    'Click Join Class to enter the classroom.'
  );

  /* ---------- Media controls ---------- */
  const [micEnabled, setMicEnabled] = useState(false);
  const [camEnabled, setCamEnabled] = useState(false);

  /* ---------- Participants ---------- */
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState('');

  /* ---------- UI state ---------- */
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState('00:00');
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  /* ---------- Refs ---------- */
  const containerRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localTracksRef = useRef<LocalTrack[]>([]);
  const remoteVideoElsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const remoteAudioElsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const roomRef = useRef<Room | null>(null);
  const mountedRef = useRef(true);

  /* ============================================================
     MOUNT / UNMOUNT
     ============================================================ */

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanupAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanupAll = () => {
    // Stop local tracks
    localTracksRef.current.forEach((t) => {
      try {
        t.stop();
        t.detach();
      } catch {
        /* ignore */
      }
    });
    localTracksRef.current = [];

    // Remove remote elements
    remoteVideoElsRef.current.forEach((el) => el.remove());
    remoteVideoElsRef.current.clear();
    remoteAudioElsRef.current.forEach((el) => el.remove());
    remoteAudioElsRef.current.clear();

    // Disconnect
    if (roomRef.current) {
      roomRef.current.disconnect().catch(() => {});
      roomRef.current = null;
    }
  };

  /* ============================================================
     SESSION TIMER
     ============================================================ */

  useEffect(() => {
    if (status !== 'started' || !sessionStart) return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - sessionStart) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(
        h > 0
          ? `${String(h).padStart(2, '0')}:${String(m).padStart(
              2,
              '0'
            )}:${String(s).padStart(2, '0')}`
          : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [status, sessionStart]);

  /* ============================================================
     FULLSCREEN
     ============================================================ */

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await videoContainerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  /* ============================================================
     JOIN CLASS — LiveKit
     ============================================================ */

  const joinClass = useCallback(async () => {
    if (roomRef.current) return;

    if (!assignmentId) {
      setStatus('error');
      setMessage('Class assignment ID is missing.');
      return;
    }
    if (!roomName) {
      setStatus('error');
      setMessage('LiveKit room name is missing.');
      return;
    }

    setIsConnecting(true);
    setStatus('loading');
    setMessage('Authorizing you to join the class...');
    setError('');

    try {
      /* STEP 1 — Get student token */
      const tokenRes = await fetch('/api/livekit/student-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ assignmentId, roomName }),
      });

      let tokenData: any = null;
      try {
        tokenData = await tokenRes.json();
      } catch {
        throw new Error(
          'The LiveKit authorization server returned an invalid response.'
        );
      }

      if (!tokenRes.ok || !tokenData?.success) {
        throw new Error(
          tokenData?.error ||
            'Could not join the class. Please try again in a moment.'
        );
      }

      if (!tokenData?.token || !tokenData?.url) {
        throw new Error('LiveKit token or URL was not returned by the server.');
      }

      if (String(tokenData.roomName) !== String(roomName)) {
        throw new Error(
          'The LiveKit room returned by the server does not match this class.'
        );
      }

      if (!mountedRef.current) return;

      /* STEP 2 — Create LiveKit Room */
      setMessage('Connecting you to the classroom...');

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 1280, height: 720 },
        },
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      roomRef.current = newRoom;

      /* STEP 3 — Wire events */

      const refreshParticipants = () => {
        const list: ParticipantInfo[] = [];

        // Local
        const local = newRoom.localParticipant;
        if (local) {
          list.push({
            identity: local.identity,
            name: local.name || studentName || 'You',
            isLocal: true,
            hasVideo: Boolean(
              local.getTrackPublication(Track.Source.Camera)?.track
            ),
            hasAudio: Boolean(
              local.getTrackPublication(Track.Source.Microphone)?.track
            ),
            isSpeaking: local.isSpeaking,
          });
        }

        // Remote
        newRoom.remoteParticipants.forEach((p: RemoteParticipant) => {
          list.push({
            identity: p.identity,
            name: p.name || p.identity,
            isLocal: false,
            hasVideo: Boolean(
              p.getTrackPublication(Track.Source.Camera)?.isSubscribed
            ),
            hasAudio: Boolean(
              p.getTrackPublication(Track.Source.Microphone)?.isSubscribed
            ),
            isSpeaking: p.isSpeaking,
          });
        });

        setParticipants(list);
      };

      newRoom
        .on(RoomEvent.Connected, () => {
          console.log('[Student LiveKit] Connected');
          setConnectionState(ConnectionState.Connected);
          refreshParticipants();
        })
        .on(RoomEvent.Disconnected, () => {
          console.log('[Student LiveKit] Disconnected');
          setConnectionState(ConnectionState.Disconnected);
          roomRef.current = null;
          setRoom(null);
        })
        .on(RoomEvent.Reconnecting, () => {
          setConnectionState(ConnectionState.Reconnecting);
        })
        .on(RoomEvent.Reconnected, () => {
          setConnectionState(ConnectionState.Connected);
        })
        .on(RoomEvent.ParticipantConnected, () => {
          refreshParticipants();
        })
        .on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
          const vidEl = remoteVideoElsRef.current.get(p.identity);
          if (vidEl) {
            vidEl.remove();
            remoteVideoElsRef.current.delete(p.identity);
          }
          const audEl = remoteAudioElsRef.current.get(p.identity);
          if (audEl) {
            audEl.remove();
            remoteAudioElsRef.current.delete(p.identity);
          }
          refreshParticipants();
        })
        .on(
          RoomEvent.TrackSubscribed,
          (track: RemoteTrack, _pub, participant: RemoteParticipant) => {
            if (track.kind === Track.Kind.Video) {
              const el = document.createElement('video');
              el.autoplay = true;
              el.playsInline = true;
              el.muted = false;
              el.className = 'w-full h-full object-cover';
              track.attach(el);
              remoteVideoElsRef.current.set(participant.identity, el);
            } else if (track.kind === Track.Kind.Audio) {
              const el = document.createElement('audio');
              el.autoplay = true;
              track.attach(el);
              remoteAudioElsRef.current.set(participant.identity, el);
              document.body.appendChild(el);
            }
            refreshParticipants();
          }
        )
        .on(
          RoomEvent.TrackUnsubscribed,
          (track: RemoteTrack, _pub, participant: RemoteParticipant) => {
            track.detach();
            if (track.kind === Track.Kind.Video) {
              const el = remoteVideoElsRef.current.get(participant.identity);
              if (el) {
                el.remove();
                remoteVideoElsRef.current.delete(participant.identity);
              }
            } else if (track.kind === Track.Kind.Audio) {
              const el = remoteAudioElsRef.current.get(participant.identity);
              if (el) {
                el.remove();
                remoteAudioElsRef.current.delete(participant.identity);
              }
            }
            refreshParticipants();
          }
        )
        .on(RoomEvent.TrackMuted, () => refreshParticipants())
        .on(RoomEvent.TrackUnmuted, () => refreshParticipants())
        .on(RoomEvent.LocalTrackPublished, () => refreshParticipants())
        .on(RoomEvent.LocalTrackUnpublished, () => refreshParticipants())
        .on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
          if (speakers.length > 0) {
            setActiveSpeaker(speakers[0].identity);
          } else {
            setActiveSpeaker('');
          }
        });

      /* STEP 4 — Connect */
      await newRoom.connect(tokenData.url, tokenData.token);

      /* STEP 5 — Local tracks */
      let tracks: LocalTrack[] = [];
      try {
        tracks = await createLocalTracks({
          audio: true,
          video: true,
        });
      } catch (mediaErr: any) {
        console.warn(
          '[Student LiveKit] Media permission denied or partial:',
          mediaErr?.message
        );
        // Try audio-only fallback
        try {
          tracks = await createLocalTracks({ audio: true, video: false });
        } catch {
          tracks = [];
        }
      }

      localTracksRef.current = tracks;

      /* STEP 6 — Mute first, then publish */
      for (const t of tracks) {
        try {
          await t.mute();
        } catch {
          /* ignore */
        }
      }

      for (const t of tracks) {
        try {
          await newRoom.localParticipant.publishTrack(t);
        } catch (pubErr) {
          console.warn('[Student LiveKit] publishTrack failed:', pubErr);
        }
      }

      /* STEP 7 — Local preview */
      const localVideoTrack = tracks.find(
        (t) => t.kind === Track.Kind.Video
      );
      if (localVideoTrack && localVideoRef.current) {
        localVideoTrack.attach(localVideoRef.current);
      }

      setMicEnabled(false);
      setCamEnabled(false);
      setRoom(newRoom);
      setStatus('started');
      setMessage('You are connected to the classroom.');
      setSessionStart(Date.now());
      setElapsed('00:00');
      refreshParticipants();
    } catch (err: any) {
      console.error('Student LiveKit classroom error:', err);
      if (!mountedRef.current) return;

      let errorMessage =
        err?.message || 'Unable to join the classroom.';

      const lower = String(errorMessage).toLowerCase();
      if (lower.includes('not found') && lower.includes('room')) {
        errorMessage =
          'The teacher has not started the class yet. Please wait a moment and try again.';
      } else if (lower.includes('unauthorized')) {
        errorMessage =
          'LiveKit authorization failed. Please refresh the page and try again.';
      } else if (lower.includes('invalid') && lower.includes('token')) {
        errorMessage =
          'Your classroom session has expired. Please refresh and try again.';
      } else if (
        lower.includes('network') ||
        lower.includes('failed to fetch')
      ) {
        errorMessage =
          'Could not connect to LiveKit. Please check your internet connection.';
      }

      setError(String(errorMessage));
      setStatus('error');
      setMessage(String(errorMessage));
      cleanupAll();
      setRoom(null);
    } finally {
      setIsConnecting(false);
    }
  }, [assignmentId, roomName, studentName]);

  /* ============================================================
     LEAVE CLASS
     ============================================================ */

  const leaveClass = useCallback(async () => {
    cleanupAll();
    if (!mountedRef.current) return;
    setRoom(null);
    setStatus('idle');
    setSessionStart(null);
    setElapsed('00:00');
    setParticipants([]);
    setActiveSpeaker('');
    setMicEnabled(false);
    setCamEnabled(false);
    setMessage('You have left the classroom. Click Join Class to re-enter.');
  }, []);

  /* ============================================================
     RETRY
     ============================================================ */

  const retryJoin = useCallback(() => {
    if (!mountedRef.current) return;
    setStatus('idle');
    setError('');
    setMessage('Click Join Class to enter the classroom.');
  }, []);

  /* ============================================================
     MEDIA TOGGLES
     ============================================================ */

  const toggleMic = useCallback(async () => {
    if (!roomRef.current) return;
    const audioTrack = localTracksRef.current.find(
      (t) => t.kind === Track.Kind.Audio
    );
    if (!audioTrack) return;

    try {
      if (micEnabled) {
        await audioTrack.mute();
        setMicEnabled(false);
      } else {
        await audioTrack.unmute();
        setMicEnabled(true);
      }
    } catch (err) {
      console.error('[Student LiveKit] toggleMic error:', err);
    }
  }, [micEnabled]);

  const toggleCam = useCallback(async () => {
    if (!roomRef.current) return;
    const videoTrack = localTracksRef.current.find(
      (t) => t.kind === Track.Kind.Video
    );
    if (!videoTrack) return;

    try {
      if (camEnabled) {
        await videoTrack.mute();
        setCamEnabled(false);
      } else {
        await videoTrack.unmute();
        setCamEnabled(true);
      }
    } catch (err) {
      console.error('[Student LiveKit] toggleCam error:', err);
    }
  }, [camEnabled]);

  /* ============================================================
     COPY ROOM NAME
     ============================================================ */

  const copyRoom = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomName);
      setCopiedRoom(true);
      setTimeout(() => setCopiedRoom(false), 1800);
    } catch {
      /* ignore */
    }
  }, [roomName]);

  /* ============================================================
     DERIVED
     ============================================================ */

  const remoteParticipants = useMemo(
    () => participants.filter((p) => !p.isLocal),
    [participants]
  );

  const connected = connectionState === ConnectionState.Connected;
  const reconnecting = connectionState === ConnectionState.Reconnecting;

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl border border-slate-800"
      >
        {/* ============================================
            TOP TOOLBAR
        ============================================ */}

        <div className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
          {/* Row 1 — Status + Actions */}
          <div className="flex items-center justify-between gap-3 px-3 sm:px-5 py-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <StatusBadge status={status} />

              {status === 'started' && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs font-mono font-semibold">
                  <Clock className="h-3 w-3 text-emerald-400" />
                  {elapsed}
                </span>
              )}

              {status === 'started' && (
                <button
                  type="button"
                  onClick={() => setShowParticipants((v) => !v)}
                  className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold transition ${
                    showParticipants
                      ? 'bg-sky-600 text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                  title="Toggle participants"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  {participants.length}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Copy room name */}
              <button
                type="button"
                onClick={copyRoom}
                className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-semibold transition"
                title="Copy room name"
              >
                {copiedRoom ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span className="font-mono">
                  {roomName.slice(-12)}
                </span>
              </button>

              {/* Fullscreen */}
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

              {/* Join / Leave / Retry */}
              {status !== 'started' && (
                <button
                  type="button"
                  onClick={joinClass}
                  disabled={status === 'loading'}
                  className="
                    inline-flex items-center gap-2 h-9 px-3 sm:px-4 rounded-lg
                    bg-gradient-to-r from-sky-500 to-cyan-600
                    hover:from-sky-400 hover:to-cyan-500
                    text-white text-xs sm:text-sm font-bold
                    shadow-lg shadow-cyan-500/25
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all active:scale-95
                  "
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Joining...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      <span>Join Class</span>
                    </>
                  )}
                </button>
              )}

              {status === 'started' && (
                <button
                  type="button"
                  onClick={leaveClass}
                  className="
                    inline-flex items-center gap-2 h-9 px-3 sm:px-4 rounded-lg
                    bg-gradient-to-r from-rose-500 to-red-600
                    hover:from-rose-400 hover:to-red-500
                    text-white text-xs sm:text-sm font-bold
                    shadow-lg shadow-rose-500/25
                    transition-all active:scale-95
                  "
                >
                  <PhoneOff className="h-4 w-4" />
                  <span className="hidden sm:inline">Leave</span>
                </button>
              )}

              {status === 'error' && (
                <button
                  type="button"
                  onClick={retryJoin}
                  className="
                    inline-flex items-center gap-2 h-9 px-3 rounded-lg
                    bg-white/10 hover:bg-white/15 border border-white/20
                    text-white text-xs sm:text-sm font-semibold transition
                  "
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Retry</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 2 — Class info bar */}
          <div className="flex items-center gap-3 px-3 sm:px-5 pb-3 text-xs text-white/50 overflow-x-auto whitespace-nowrap">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="text-white/80 font-semibold truncate max-w-[140px]">
                {courseName || 'Online Class'}
              </span>
            </span>
            <span className="opacity-30">·</span>
            <span className="inline-flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5" />
              <span className="truncate max-w-[120px]">
                Teacher: {teacherName}
              </span>
            </span>
            <span className="opacity-30">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Student: {studentName}</span>
            </span>
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

        {/* ============================================
            STATUS MESSAGE
        ============================================ */}

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

        {/* ============================================
            VIDEO AREA
        ============================================ */}

        <div
          ref={videoContainerRef}
          className="relative min-h-[calc(100vh-260px)] sm:min-h-[600px] w-full bg-slate-950"
        >
          {/* ---------- STARTED — Video grid ---------- */}
          {status === 'started' && (
            <>
              {/* Remote participants */}
              <div
                className={`absolute inset-0 p-2 grid gap-2 ${
                  remoteParticipants.length <= 1
                    ? 'grid-cols-1'
                    : remoteParticipants.length <= 4
                    ? 'grid-cols-2'
                    : 'grid-cols-2 md:grid-cols-3'
                }`}
              >
                {remoteParticipants.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                        <UserCircle2 className="h-10 w-10 text-white/30" />
                      </div>
                      <p className="text-white/70 text-sm font-semibold">
                        Waiting for teacher to join...
                      </p>
                      <p className="text-white/30 text-xs mt-1">
                        You are connected. Please wait.
                      </p>
                    </div>
                  </div>
                ) : (
                  remoteParticipants.map((p) => (
                    <RemoteVideoTile
                      key={p.identity}
                      participant={p}
                      videoEl={remoteVideoElsRef.current.get(p.identity)}
                      isActiveSpeaker={activeSpeaker === p.identity}
                    />
                  ))
                )}
              </div>

              {/* Local video (PiP) */}
              <div className="absolute bottom-4 right-4 w-32 sm:w-44 lg:w-52 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-800 z-10">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {!camEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <div className="text-center">
                      <VideoOff className="h-7 w-7 text-white/30 mx-auto" />
                      <p className="text-[10px] text-white/40 mt-1 font-semibold">
                        Camera off
                      </p>
                    </div>
                  </div>
                )}
                {!micEnabled && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-rose-600 flex items-center justify-center shadow-lg">
                    <MicOff className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
                <div className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm">
                  <p className="text-[10px] font-bold text-white">
                    You
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ---------- IDLE placeholder ---------- */}
          {status === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="text-center max-w-sm">
                <div className="relative mx-auto h-20 w-20 mb-5">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-sky-500 to-cyan-600 blur-2xl opacity-50 animate-pulse" />
                  <div className="relative h-full w-full rounded-3xl bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-cyan-500/40">
                    <Video className="h-10 w-10 text-white" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white">
                  Ready to join
                </h3>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">
                  Click{' '}
                  <span className="text-sky-400 font-semibold">
                    Join Class
                  </span>{' '}
                  to enter the classroom. Your teacher will be waiting for you.
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                    <Wifi className="h-3 w-3 text-emerald-400" />
                    HD Video
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                    <Mic className="h-3 w-3 text-sky-400" />
                    Audio
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                    <Monitor className="h-3 w-3 text-violet-400" />
                    Screen Share
                  </span>
                </div>

                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-200 text-[11px] font-semibold">
                  <ShieldCheck className="h-3 w-3" />
                  No recording · Private session
                </div>
              </div>
            </div>
          )}

          {/* ---------- LOADING overlay ---------- */}
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

        {/* ============================================
            CONTROL BAR (running)
        ============================================ */}

        {status === 'started' && (
          <div className="flex items-center justify-center gap-2 px-4 py-4 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 flex-wrap">
            {/* Mic */}
            <button
              type="button"
              onClick={toggleMic}
              className={`inline-flex items-center justify-center h-11 w-11 rounded-full transition active:scale-95 ${
                micEnabled
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
              title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {micEnabled ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </button>

            {/* Camera */}
            <button
              type="button"
              onClick={toggleCam}
              className={`inline-flex items-center justify-center h-11 w-11 rounded-full transition active:scale-95 ${
                camEnabled
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
              title={camEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {camEnabled ? (
                <Video className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5" />
              )}
            </button>

            {/* Divider */}
            <div className="w-px h-7 bg-white/10 mx-1" />

            {/* Leave */}
            <button
              type="button"
              onClick={leaveClass}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-500/30 transition active:scale-95"
              title="Leave class"
            >
              <PhoneOff className="h-4 w-4" />
              <span>Leave Class</span>
            </button>
          </div>
        )}

        {/* ============================================
            BOTTOM INFO BAR (running)
        ============================================ */}

        {status === 'started' && (
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 border-t border-white/10 bg-slate-950/60 text-xs">
            <div className="flex items-center gap-2 text-white/50 min-w-0">
              {connected ? (
                <>
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span className="font-semibold text-emerald-300">
                    Connected
                  </span>
                  <span className="hidden sm:inline opacity-60">
                    · Keep this tab open during class
                  </span>
                </>
              ) : reconnecting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-amber-400 shrink-0" />
                  <span className="font-semibold text-amber-300">
                    Reconnecting
                  </span>
                </>
              ) : (
                <>
                  <Wifi className="h-3 w-3 text-rose-400 shrink-0" />
                  <span className="font-semibold text-rose-300">Offline</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 text-[11px] text-white/40">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Attendee · Secured</span>
            </div>
          </div>
        )}
      </div>

      {/* ============================================
          ERROR TOAST (during session)
      ============================================ */}

      {error && room && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] max-w-md">
          <div className="bg-rose-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm font-semibold">{error}</div>
            <button
              type="button"
              onClick={() => setError('')}
              className="text-white/80 hover:text-white shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ============================================
          PARTICIPANTS PANEL
      ============================================ */}

      {showParticipants && status === 'started' && (
        <div className="fixed top-20 right-4 z-[100] w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-sky-400" />
              <span className="text-sm font-bold text-white">
                Participants ({participants.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowParticipants(false)}
              className="text-white/40 hover:text-white/80"
            >
              ✕
            </button>
          </div>

          <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
            {participants.map((p) => (
              <div
                key={p.identity}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition"
              >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-white/40 truncate">
                    {p.isLocal ? 'Student · You' : 'Teacher'}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!p.hasAudio && <MicOff className="h-3 w-3 text-rose-400" />}
                  {p.hasAudio && p.isSpeaking && (
                    <Volume2 className="h-3 w-3 text-emerald-400 animate-pulse" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   REMOTE VIDEO TILE
   ============================================================ */

function RemoteVideoTile({
  participant,
  videoEl,
  isActiveSpeaker,
}: {
  participant: ParticipantInfo;
  videoEl?: HTMLVideoElement;
  isActiveSpeaker: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (videoEl) {
      container.innerHTML = '';
      videoEl.className = 'w-full h-full object-cover';
      container.appendChild(videoEl);
      videoEl.play().catch(() => {
        /* autoplay may be blocked */
      });
    } else {
      container.innerHTML = '';
    }
  }, [videoEl]);

  return (
    <div
      className={`relative bg-slate-800 rounded-xl overflow-hidden transition-all duration-300 ${
        isActiveSpeaker
          ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20'
          : 'ring-1 ring-white/5'
      }`}
    >
      <div ref={containerRef} className="w-full h-full" />

      {!videoEl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-2xl mx-auto">
              {participant.name.slice(0, 2).toUpperCase()}
            </div>
            <p className="text-white/40 text-[11px] font-semibold mt-3">
              Camera off
            </p>
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm flex items-center gap-2">
        <p className="text-xs font-bold text-white">{participant.name}</p>
        {isActiveSpeaker && (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400">
              Speaking
            </span>
          </span>
        )}
      </div>

      {!participant.hasAudio && (
        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-rose-600 flex items-center justify-center shadow-lg">
          <MicOff className="h-3 w-3 text-white" />
        </div>
      )}
    </div>
  );
}

/* ============================================================
   STATUS BADGE
   ============================================================ */

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
      label: 'Ready',
      classes: 'bg-white/5 border-white/10 text-white/60',
      dot: 'bg-slate-400',
      Icon: Radio,
    },
    loading: {
      label: 'Joining',
      classes: 'bg-sky-500/10 border-sky-500/20 text-sky-200',
      dot: 'bg-sky-400',
      Icon: Loader2,
    },
    started: {
      label: 'In Class',
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