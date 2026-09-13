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
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  MonitorOff,
  PhoneOff,
  Users,
  Code2,
  Palette,
  Loader2,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  WifiOff,
  UserCircle2,
  Volume2,
  ShieldCheck,
  Sparkles,
  Zap,
  Eye,
  EyeOff,
  Share2,
  AudioLines,
  Waves,
} from 'lucide-react';

import CodeEditorOverlay from '@/app/components/teacher/CodeEditorOverlay';
import DesignStudioOverlay from '@/app/components/teacher/DesignStudioOverlay';
import STEMBoardOverlay from '@/app/components/teacher/boards/STEMBoardOverlay';

import {
  type WhiteboardKind,
  type WhiteboardMessage,
  type CodeBoardState,
  type DesignBoardState,
  type STEMBoardState,
  WHITEBOARD_TOPIC,
  encodeMessage,
} from '@/app/lib/livekit/whiteboardChannel';

/* ============================================================ */
/* ✅ TYPE-SAFE WRAPPERS — onStateChange prop کے لیے            */
/* ============================================================ */

type BoardProps<T> = {
  onClose: () => void;
  onStateChange?: (state: T) => void;
};

const CodeEditor = CodeEditorOverlay as unknown as React.ComponentType<
  BoardProps<CodeBoardState>
>;
const STEMBoard = STEMBoardOverlay as unknown as React.ComponentType<
  BoardProps<STEMBoardState>
>;
const DesignBoard = DesignStudioOverlay as unknown as React.ComponentType<
  BoardProps<DesignBoardState>
>;

/* ============================================================ */
/* TYPES                                                        */
/* ============================================================ */

type WhiteboardMode = null | WhiteboardKind;

interface Props {
  assignmentId: string;
  roomName: string;
  hostIdentity: string;
  teacherName: string;
  teacherEmail: string;
  courseName: string;
  studentName: string;
  courseId: string;
  totalPages: number;
  pagesCompletedSoFar: number;
}

interface ParticipantInfo {
  identity: string;
  name: string;
  isLocal: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  isSpeaking: boolean;
}

/* ============================================================ */
/* NOISE CANCELLATION HELPER (Krisp)                            */
/* ============================================================ */

/**
 * LiveKit Krisp Noise Filter استعمال کرتا ہے اگر installed ہو۔
 * Install: npm install @livekit/krisp-noise-filter
 */
async function applyKrispNoiseFilter(track: LocalTrack): Promise<boolean> {
  try {
    // Dynamic import — package نہ ہو تو error نہ دے
    const mod: any = await import('@livekit/krisp-noise-filter').catch(
      () => null
    );

    if (!mod || !mod.KrispNoiseFilter) {
      console.warn(
        '[LiveKit] Krisp noise filter not installed. Falling back to browser noise suppression.'
      );
      return false;
    }

    const filter = new mod.KrispNoiseFilter();
    // LocalAudioTrack کے پاس setProcessor موجود ہے
    if (typeof (track as any).setProcessor === 'function') {
      await (track as any).setProcessor(filter);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[LiveKit] Krisp error:', err);
    return false;
  }
}

async function removeProcessor(track: LocalTrack): Promise<void> {
  try {
    if (typeof (track as any).stopProcessor === 'function') {
      await (track as any).stopProcessor();
    } else if (typeof (track as any).setProcessor === 'function') {
      await (track as any).setProcessor(undefined);
    }
  } catch (err) {
    console.warn('[LiveKit] removeProcessor error:', err);
  }
}

/* ============================================================ */
/* MAIN COMPONENT                                               */
/* ============================================================ */

export default function TeacherLiveKitClassroomLoader({
  assignmentId,
  roomName,
  hostIdentity,
  teacherName,
  teacherEmail,
  courseName,
  studentName,
  courseId,
  totalPages,
  pagesCompletedSoFar,
}: Props) {
  /* ---------- Connection ---------- */
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  /* ---------- Media ---------- */
  const [micEnabled, setMicEnabled] = useState(false);
  const [camEnabled, setCamEnabled] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);

  /* ---------- ✅ Noise Cancellation ---------- */
  const [noiseCancellation, setNoiseCancellation] = useState(true);
  const [krispAvailable, setKrispAvailable] = useState(true);

  /* ---------- Participants ---------- */
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState('');

  /* ---------- UI ---------- */
  const [whiteboard, setWhiteboard] = useState<WhiteboardMode>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedRoom, setCopiedRoom] = useState(false);

  /* ---------- Whiteboard Sharing ---------- */
  const [isSharingWhiteboard, setIsSharingWhiteboard] = useState(false);
  const [studentCount, setStudentCount] = useState(0);

  /* ---------- Refs ---------- */
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localTracksRef = useRef<LocalTrack[]>([]);
  const remoteVideoElementsRef = useRef<Map<string, HTMLVideoElement>>(
    new Map()
  );
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(
    new Map()
  );
  const roomRef = useRef<Room | null>(null);

  // Latest state of each whiteboard
  const boardStatesRef = useRef<Record<WhiteboardKind, any>>({
    code: {},
    design: {},
    stem: {},
  });

  // Throttle broadcast per board
  const lastBroadcastRef = useRef<Record<WhiteboardKind, number>>({
    code: 0,
    design: 0,
    stem: 0,
  });

  // Latest isSharing & whiteboard in refs for callbacks
  const isSharingRef = useRef(false);
  const whiteboardRef = useRef<WhiteboardMode>(null);
  const noiseCancelRef = useRef(true);

  useEffect(() => {
    isSharingRef.current = isSharingWhiteboard;
  }, [isSharingWhiteboard]);

  useEffect(() => {
    whiteboardRef.current = whiteboard;
  }, [whiteboard]);

  useEffect(() => {
    noiseCancelRef.current = noiseCancellation;
  }, [noiseCancellation]);

  /* ============================================================ */
  /* PUBLISH WHITEBOARD MESSAGE                                   */
  /* ============================================================ */

  const publishWhiteboardMessage = useCallback(
    async (message: WhiteboardMessage) => {
      const r = roomRef.current;
      if (!r) return;

      try {
        const encoded = encodeMessage(message);
        // ✅ Uint8Array<ArrayBufferLike> → Uint8Array<ArrayBuffer>
        const payload = new Uint8Array(encoded);

        await r.localParticipant.publishData(payload, {
          reliable: true,
          topic: WHITEBOARD_TOPIC,
        });
      } catch (err) {
        console.warn('[WB] publish failed:', err);
      }
    },
    []
  );

  /* ============================================================ */
  /* OPEN / CLOSE / STATE CHANGE                                  */
  /* ============================================================ */

  const openWhiteboard = useCallback(
    (board: WhiteboardKind) => {
      setWhiteboard(board);

      if (isSharingRef.current) {
        publishWhiteboardMessage({
          type: 'wb-open',
          board,
          state: boardStatesRef.current[board] || {},
          senderName: teacherName,
        });
      }
    },
    [publishWhiteboardMessage, teacherName]
  );

  const closeWhiteboard = useCallback(() => {
    const current = whiteboardRef.current;
    setWhiteboard(null);

    if (current && isSharingRef.current) {
      publishWhiteboardMessage({ type: 'wb-close', board: current });
    }
  }, [publishWhiteboardMessage]);

  const handleBoardStateChange = useCallback(
    (board: WhiteboardKind, state: any) => {
      boardStatesRef.current[board] = state;

      if (!isSharingRef.current || whiteboardRef.current !== board) return;

      // Throttle: Design = 15fps, Code/STEM = 5fps
      const now = Date.now();
      const minInterval = board === 'design' ? 66 : 200;
      if (now - lastBroadcastRef.current[board] < minInterval) return;
      lastBroadcastRef.current[board] = now;

      publishWhiteboardMessage({
        type: 'wb-state',
        board,
        state,
      });
    },
    [publishWhiteboardMessage]
  );

  /* ============================================================ */
  /* TOGGLE SHARING                                               */
  /* ============================================================ */

  const toggleWhiteboardSharing = useCallback(async () => {
    const next = !isSharingRef.current;
    setIsSharingWhiteboard(next);

    const currentBoard = whiteboardRef.current;

    if (next && currentBoard) {
      await publishWhiteboardMessage({
        type: 'wb-open',
        board: currentBoard,
        state: boardStatesRef.current[currentBoard] || {},
        senderName: teacherName,
      });
    } else if (!next && currentBoard) {
      await publishWhiteboardMessage({
        type: 'wb-close',
        board: currentBoard,
      });
    }
  }, [publishWhiteboardMessage, teacherName]);

  /* ============================================================ */
  /* ✅ TOGGLE NOISE CANCELLATION                                 */
  /* ============================================================ */

  const toggleNoiseCancellation = useCallback(async () => {
    const audioTrack = localTracksRef.current.find(
      (t) => t.kind === Track.Kind.Audio
    );
    if (!audioTrack) {
      setError('Microphone track is not available yet.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const next = !noiseCancellation;

    try {
      if (next) {
        const ok = await applyKrispNoiseFilter(audioTrack);
        if (!ok) {
          setKrispAvailable(false);
          // Browser-level noise suppression پہلے سے on ہے
        }
        setNoiseCancellation(true);
      } else {
        await removeProcessor(audioTrack);
        setNoiseCancellation(false);
      }
    } catch (err) {
      console.error('[LiveKit] toggleNoiseCancellation error:', err);
      setNoiseCancellation(next);
    }
  }, [noiseCancellation]);

  /* ============================================================ */
  /* CONNECT TO LIVEKIT ROOM                                      */
  /* ============================================================ */

  const connectToRoom = useCallback(async () => {
    if (roomRef.current) return;

    setIsConnecting(true);
    setError('');

    try {
      const tokenRes = await fetch('/api/livekit/teacher-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ assignmentId, roomName }),
      });

      if (!tokenRes.ok) {
        const data = await tokenRes.json().catch(() => ({}));
        throw new Error(
          data?.error || `Token request failed (HTTP ${tokenRes.status})`
        );
      }

      const { token, url } = await tokenRes.json();

      if (!token || !url) {
        throw new Error('Server did not return token or URL');
      }

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: { resolution: { width: 1280, height: 720 } },
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      roomRef.current = newRoom;

      const refreshParticipants = () => {
        const list: ParticipantInfo[] = [];

        const local = newRoom.localParticipant;
        if (local) {
          list.push({
            identity: local.identity,
            name: local.name || teacherName || 'You',
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

        let count = 0;
        newRoom.remoteParticipants.forEach((p: RemoteParticipant) => {
          count++;
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
        setStudentCount(count);
      };

      newRoom
        .on(RoomEvent.Connected, () => {
          setConnectionState(ConnectionState.Connected);
          refreshParticipants();
        })
        .on(RoomEvent.Disconnected, () => {
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
          // Send current whiteboard state to newly joined participant
          if (isSharingRef.current && whiteboardRef.current) {
            publishWhiteboardMessage({
              type: 'wb-open',
              board: whiteboardRef.current,
              state: boardStatesRef.current[whiteboardRef.current] || {},
              senderName: teacherName,
            });
          }
        })
        .on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
          const vidEl = remoteVideoElementsRef.current.get(p.identity);
          if (vidEl) {
            vidEl.remove();
            remoteVideoElementsRef.current.delete(p.identity);
          }
          const audEl = remoteAudioElementsRef.current.get(p.identity);
          if (audEl) {
            audEl.remove();
            remoteAudioElementsRef.current.delete(p.identity);
          }
          refreshParticipants();
        })
        .on(
          RoomEvent.TrackSubscribed,
          (track: RemoteTrack, _pub, participant) => {
            if (track.kind === Track.Kind.Video) {
              const el = document.createElement('video');
              el.autoplay = true;
              el.playsInline = true;
              el.muted = false;
              el.className = 'w-full h-full object-cover';
              track.attach(el);
              remoteVideoElementsRef.current.set(participant.identity, el);
            } else if (track.kind === Track.Kind.Audio) {
              const el = document.createElement('audio');
              el.autoplay = true;
              track.attach(el);
              remoteAudioElementsRef.current.set(participant.identity, el);
              document.body.appendChild(el);
            }
            refreshParticipants();
          }
        )
        .on(
          RoomEvent.TrackUnsubscribed,
          (track: RemoteTrack, _pub, participant) => {
            track.detach();
            if (track.kind === Track.Kind.Video) {
              const el = remoteVideoElementsRef.current.get(
                participant.identity
              );
              if (el) {
                el.remove();
                remoteVideoElementsRef.current.delete(participant.identity);
              }
            } else if (track.kind === Track.Kind.Audio) {
              const el = remoteAudioElementsRef.current.get(
                participant.identity
              );
              if (el) {
                el.remove();
                remoteAudioElementsRef.current.delete(participant.identity);
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

      await newRoom.connect(url, token);

      let tracks: LocalTrack[] = [];
      try {
        tracks = await createLocalTracks({ audio: true, video: true });
      } catch {
        try {
          tracks = await createLocalTracks({ audio: true, video: false });
        } catch {
          tracks = [];
        }
      }

      localTracksRef.current = tracks;

      /* ✅ Auto-apply Krisp noise filter on audio track if enabled */
      if (noiseCancelRef.current) {
        const audioTrack = tracks.find((t) => t.kind === Track.Kind.Audio);
        if (audioTrack) {
          const ok = await applyKrispNoiseFilter(audioTrack);
          setKrispAvailable(ok);
          if (!ok) setNoiseCancellation(false);
        }
      }

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
          console.warn('[LiveKit] publishTrack failed:', pubErr);
        }
      }

      const localVideoTrack = tracks.find(
        (t) => t.kind === Track.Kind.Video
      );
      if (localVideoTrack && localVideoRef.current) {
        localVideoTrack.attach(localVideoRef.current);
      }

      setMicEnabled(false);
      setCamEnabled(false);
      setRoom(newRoom);
      refreshParticipants();
    } catch (err: any) {
      console.error('[LiveKit] Connection error:', err);
      setError(err?.message || 'Failed to connect to LiveKit room');
      setConnectionState(ConnectionState.Disconnected);
      roomRef.current = null;
    } finally {
      setIsConnecting(false);
    }
  }, [
    assignmentId,
    roomName,
    teacherName,
    publishWhiteboardMessage,
  ]);

  /* ============================================================ */
  /* DISCONNECT                                                   */
  /* ============================================================ */

  const disconnect = useCallback(async () => {
    try {
      localTracksRef.current.forEach((t) => {
        try {
          t.stop();
          t.detach();
        } catch {
          /* ignore */
        }
      });
      localTracksRef.current = [];

      remoteVideoElementsRef.current.forEach((el) => el.remove());
      remoteVideoElementsRef.current.clear();
      remoteAudioElementsRef.current.forEach((el) => el.remove());
      remoteAudioElementsRef.current.clear();

      if (roomRef.current) {
        await roomRef.current.disconnect();
      }
      roomRef.current = null;

      setRoom(null);
      setParticipants([]);
      setConnectionState(ConnectionState.Disconnected);
      setMicEnabled(false);
      setCamEnabled(false);
      setScreenSharing(false);
      setActiveSpeaker('');
      setWhiteboard(null);
      setIsSharingWhiteboard(false);
      setStudentCount(0);
    } catch (err) {
      console.error('[LiveKit] Disconnect error:', err);
    }
  }, []);

  /* ============================================================ */
  /* CLEANUP                                                      */
  /* ============================================================ */

  useEffect(() => {
    return () => {
      localTracksRef.current.forEach((t) => {
        try {
          t.stop();
        } catch {
          /* ignore */
        }
      });
      localTracksRef.current = [];

      remoteVideoElementsRef.current.forEach((el) => el.remove());
      remoteVideoElementsRef.current.clear();
      remoteAudioElementsRef.current.forEach((el) => el.remove());
      remoteAudioElementsRef.current.clear();

      if (roomRef.current) {
        roomRef.current.disconnect().catch(() => {});
        roomRef.current = null;
      }
    };
  }, []);

  /* ============================================================ */
  /* MEDIA TOGGLES                                                */
  /* ============================================================ */

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
      console.error('[LiveKit] toggleMic error:', err);
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
      console.error('[LiveKit] toggleCam error:', err);
    }
  }, [camEnabled]);

  const toggleScreenShare = useCallback(async () => {
    if (!roomRef.current) return;
    try {
      if (screenSharing) {
        await roomRef.current.localParticipant.setScreenShareEnabled(false);
        setScreenSharing(false);
      } else {
        await roomRef.current.localParticipant.setScreenShareEnabled(true);
        setScreenSharing(true);
      }
    } catch (err: any) {
      console.error('[LiveKit] Screen share error:', err);
      if (err?.name !== 'NotAllowedError') {
        setError('Screen sharing failed. Please allow screen access.');
        setTimeout(() => setError(''), 4000);
      }
    }
  }, [screenSharing]);

  /* ============================================================ */
  /* FULLSCREEN                                                   */
  /* ============================================================ */

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
      console.error('[LiveKit] Fullscreen error:', err);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  /* ============================================================ */
  /* COPY ROOM                                                    */
  /* ============================================================ */

  const copyRoomName = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomName);
      setCopiedRoom(true);
      setTimeout(() => setCopiedRoom(false), 1500);
    } catch {
      /* ignore */
    }
  }, [roomName]);

  /* ============================================================ */
  /* DERIVED                                                      */
  /* ============================================================ */

  const remoteParticipants = useMemo(
    () => participants.filter((p) => !p.isLocal),
    [participants]
  );

  const connected = connectionState === ConnectionState.Connected;
  const reconnecting = connectionState === ConnectionState.Reconnecting;

  /* ============================================================ */
  /* RENDER — CONNECTING                                          */
  /* ============================================================ */

  if (isConnecting) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-12">
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto mb-5 h-20 w-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Connecting to LiveKit Classroom
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Setting up your camera and microphone.
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================ */
  /* RENDER — ERROR                                               */
  /* ============================================================ */

  if (error && !room) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-8 sm:p-12">
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-rose-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-rose-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Could not connect
          </h3>
          <p className="text-sm text-slate-500 mt-2 break-words">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError('');
              connectToRoom();
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:from-indigo-700 hover:to-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* ============================================================ */
  /* RENDER — READY TO JOIN                                       */
  /* ============================================================ */

  if (!room) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="text-center max-w-lg mx-auto">
            <div className="mx-auto mb-5 h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <VideoIcon className="h-10 w-10 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-slate-900">
              Ready to Start Class?
            </h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              You are joining as the{' '}
              <strong className="text-slate-700">Host</strong>. Your camera
              and microphone will start muted.
            </p>

            <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Room Name
                </span>
                <button
                  type="button"
                  onClick={copyRoomName}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 transition"
                >
                  {copiedRoom ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="font-mono text-xs text-slate-700 break-all">
                {roomName}
              </p>
            </div>

            <button
              type="button"
              onClick={connectToRoom}
              disabled={isConnecting}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/30 transition disabled:opacity-60 active:scale-[0.99]"
            >
              <VideoIcon className="h-5 w-5" />
              Start LiveKit Class
            </button>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Live-only · No recording
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                Encrypted transport
              </span>
              <span className="inline-flex items-center gap-1.5">
                <AudioLines className="h-3.5 w-3.5 text-violet-500" />
                AI Noise Cancellation
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================ */
  /* RENDER — CONNECTED CLASSROOM                                 */
  /* ============================================================ */

  return (
    <>
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* ============ TOP BAR ============ */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              {connected ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider hidden sm:inline">
                    Live
                  </span>
                </>
              ) : reconnecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider hidden sm:inline">
                    Reconnecting
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-rose-400" />
                  <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider hidden sm:inline">
                    Offline
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold text-white/90 truncate">
                {courseName}
              </span>
              <span className="text-white/30 hidden sm:inline">·</span>
              <span className="text-xs text-white/50 truncate hidden sm:inline">
                {studentName}
              </span>
            </div>

            {/* ✅ Noise cancel indicator */}
            {noiseCancellation && (
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-400/40 text-violet-300 text-[10px] font-bold uppercase tracking-wider">
                <AudioLines className="h-2.5 w-2.5" />
                AI Noise OFF
              </span>
            )}

            {/* ✅ Sharing indicator */}
            {isSharingWhiteboard && whiteboard && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                Sharing {whiteboard.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowParticipants((v) => !v)}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold transition ${
                showParticipants
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
              title="Toggle participants"
            >
              <Users className="h-3.5 w-3.5" />
              {participants.length}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition"
              title="Toggle fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* ============ VIDEO AREA ============ */}
        <div
          ref={videoContainerRef}
          className="relative bg-slate-950 aspect-video max-h-[70vh] overflow-hidden"
        >
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
                    Waiting for student to join...
                  </p>
                  <p className="text-white/30 text-xs mt-1">
                    Room is live and ready
                  </p>
                </div>
              </div>
            ) : (
              remoteParticipants.map((p) => (
                <RemoteVideoTile
                  key={p.identity}
                  participant={p}
                  videoEl={remoteVideoElementsRef.current.get(p.identity)}
                  isActiveSpeaker={activeSpeaker === p.identity}
                />
              ))
            )}
          </div>

          {/* Local PiP */}
          <div className="absolute bottom-4 right-4 w-32 sm:w-48 lg:w-56 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-800 z-10">
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
                  <VideoOff className="h-8 w-8 text-white/30 mx-auto" />
                  <p className="text-[10px] text-white/40 mt-1 font-semibold">
                    Camera off
                  </p>
                </div>
              </div>
            )}
            {!micEnabled && (
              <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-rose-600 flex items-center justify-center shadow-lg">
                <MicOff className="h-3 w-3 text-white" />
              </div>
            )}
            <div className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm">
              <p className="text-[10px] font-bold text-white">You (Host)</p>
            </div>
          </div>
        </div>

        {/* ============ CONTROL BAR ============ */}
        <div className="flex items-center justify-center gap-2 px-4 py-4 bg-slate-950/80 border-t border-white/10 flex-wrap">
          {/* Mic */}
          <button
            type="button"
            onClick={toggleMic}
            className={`inline-flex items-center justify-center h-12 w-12 rounded-full transition active:scale-95 ${
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

          {/* ✅ Noise Cancellation Toggle */}
          <button
            type="button"
            onClick={toggleNoiseCancellation}
            className={`inline-flex items-center justify-center h-12 w-12 rounded-full transition active:scale-95 relative ${
              noiseCancellation
                ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white hover:from-violet-400 hover:to-purple-500 ring-2 ring-violet-400/40'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
            title={
              noiseCancellation
                ? `AI Noise Cancellation ON${!krispAvailable ? ' (browser mode)' : ''}`
                : 'Enable AI Noise Cancellation'
            }
          >
            <AudioLines className="h-5 w-5" />
            {noiseCancellation && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
            )}
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={toggleCam}
            className={`inline-flex items-center justify-center h-12 w-12 rounded-full transition active:scale-95 ${
              camEnabled
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-rose-600 text-white hover:bg-rose-700'
            }`}
            title={camEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {camEnabled ? (
              <VideoIcon className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </button>

          {/* Screen share */}
          <button
            type="button"
            onClick={toggleScreenShare}
            className={`inline-flex items-center justify-center h-12 w-12 rounded-full transition active:scale-95 ${
              screenSharing
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={screenSharing ? 'Stop sharing' : 'Share screen'}
          >
            {screenSharing ? (
              <MonitorOff className="h-5 w-5" />
            ) : (
              <MonitorUp className="h-5 w-5" />
            )}
          </button>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* SHARE TOGGLE */}
          <button
            type="button"
            onClick={toggleWhiteboardSharing}
            className={`inline-flex items-center gap-2 h-12 px-4 rounded-full text-xs font-bold shadow-lg transition active:scale-95 ${
              isSharingWhiteboard
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white ring-2 ring-emerald-400/50'
                : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
            }`}
            title={
              isSharingWhiteboard
                ? 'Stop sharing whiteboard with students'
                : 'Share whiteboard with students'
            }
          >
            {isSharingWhiteboard ? (
              <>
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Sharing ON</span>
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                <span className="hidden sm:inline">Share Board</span>
              </>
            )}
          </button>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* Code */}
          <button
            type="button"
            onClick={() => openWhiteboard('code')}
            className={`inline-flex items-center gap-2 h-12 px-4 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition active:scale-95 ${
              whiteboard === 'code' ? 'ring-2 ring-sky-400/60' : ''
            }`}
            title="Open Code Editor"
          >
            <Code2 className="h-4 w-4" />
            <span className="hidden sm:inline">Code</span>
          </button>

          {/* STEM */}
          <button
            type="button"
            onClick={() => openWhiteboard('stem')}
            className={`inline-flex items-center gap-2 h-12 px-4 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-bold shadow-lg shadow-violet-500/20 transition active:scale-95 ${
              whiteboard === 'stem' ? 'ring-2 ring-violet-400/60' : ''
            }`}
            title="Open STEM Board"
          >
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">STEM</span>
          </button>

          {/* Design */}
          <button
            type="button"
            onClick={() => openWhiteboard('design')}
            className={`inline-flex items-center gap-2 h-12 px-4 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-fuchsia-500/20 transition active:scale-95 ${
              whiteboard === 'design' ? 'ring-2 ring-fuchsia-400/60' : ''
            }`}
            title="Open Design Studio"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Design</span>
          </button>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* End class */}
          <button
            type="button"
            onClick={disconnect}
            className="inline-flex items-center gap-2 h-12 px-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-500/30 transition active:scale-95"
            title="End class"
          >
            <PhoneOff className="h-4 w-4" />
            <span className="hidden sm:inline">End Class</span>
          </button>
        </div>

        {/* ✅ Bottom status strip — Noise Cancellation info */}
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-slate-950/60 border-t border-white/5 text-[10px]">
          <div className="flex items-center gap-2 text-white/50">
            <AudioLines
              className={`h-3 w-3 ${
                noiseCancellation ? 'text-violet-400' : 'text-white/30'
              }`}
            />
            <span className="font-semibold">
              AI Noise Cancellation:{' '}
              <span
                className={
                  noiseCancellation ? 'text-violet-300' : 'text-white/40'
                }
              >
                {noiseCancellation
                  ? krispAvailable
                    ? 'Active (Krisp)'
                    : 'Active (Browser)'
                  : 'Off'}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <Waves className="h-3 w-3" />
            <span>Echo & background noise reduced</span>
          </div>
        </div>
      </div>

      {/* ============ PARTICIPANTS PANEL ============ */}
      {showParticipants && (
        <div className="fixed top-20 right-4 z-[100] w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-bold text-white">
                Participants ({participants.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowParticipants(false)}
              className="text-white/40 hover:text-white/80 transition"
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
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-white/40 truncate">
                    {p.isLocal ? 'Host · You' : 'Student'}
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

      {/* ============ ERROR TOAST ============ */}
      {error && room && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] max-w-md">
          <div className="bg-rose-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
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

      {/* ============ SHARING INDICATOR ============ */}
      {isSharingWhiteboard && whiteboard && (
        <div className="fixed bottom-4 left-4 z-[100] flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-600 text-white shadow-2xl text-xs font-bold">
          <Share2 className="h-3.5 w-3.5" />
          Sharing {whiteboard.toUpperCase()} with {studentCount} student
          {studentCount !== 1 ? 's' : ''}
        </div>
      )}

      {/* ============ WHITEBOARDS ============ */}
      {whiteboard === 'code' && (
        <CodeEditor
          onClose={closeWhiteboard}
          onStateChange={(state) => handleBoardStateChange('code', state)}
        />
      )}
      {whiteboard === 'stem' && (
        <STEMBoard
          onClose={closeWhiteboard}
          onStateChange={(state) => handleBoardStateChange('stem', state)}
        />
      )}
      {whiteboard === 'design' && (
        <DesignBoard
          onClose={closeWhiteboard}
          onStateChange={(state) => handleBoardStateChange('design', state)}
        />
      )}
    </>
  );
}

/* ============================================================ */
/* REMOTE VIDEO TILE                                            */
/* ============================================================ */

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
      videoEl.play().catch(() => {});
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
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-2xl mx-auto">
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