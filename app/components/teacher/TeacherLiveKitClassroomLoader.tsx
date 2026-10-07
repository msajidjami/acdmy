'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Room, RoomEvent, ConnectionState, Track, createLocalTracks,
  type LocalTrack, type RemoteParticipant, type RemoteTrack, type Participant,
} from 'livekit-client';

import {
  Mic, MicOff, Video as VideoIcon, VideoOff,
  MonitorUp, MonitorOff, PhoneOff, Users,
  Code2, Palette, Loader2, AlertTriangle,
  Maximize2, Minimize2, WifiOff, UserCircle2, Volume2,
  AudioLines, Zap, Eye, EyeOff, Share2, X,
  Pencil, Highlighter, ArrowRight, Square, Circle,
  Eraser, Trash2, Undo2, MousePointer2, Sparkles,
} from 'lucide-react';

import CodeEditorOverlay from '@/app/components/teacher/CodeEditorOverlay';
import DesignStudioOverlay from '@/app/components/teacher/DesignStudioOverlay';
import STEMBoardOverlay from '@/app/components/teacher/boards/STEMBoardOverlay';

import {
  type WhiteboardKind, type WhiteboardMessage,
  type CodeBoardState, type DesignBoardState, type STEMBoardState,
  WHITEBOARD_TOPIC, encodeMessage,
} from '@/app/lib/livekit/whiteboardChannel';

import {
  ANNOTATION_TOPIC,
  encodeAnnotation,
  drawAnnotationStroke,
  drawLaser,
  type AnnotationMessage,
  type AnnotationPoint,
  type AnnotationStroke,
  type AnnotationTool,
} from '@/app/lib/livekit/annotationChannel';

import { useSilentTranscript } from '@/app/hooks/useSilentTranscript';

/* ---------- Type-safe wrappers ---------- */
type BoardProps<T> = {
  onClose: () => void;
  onStateChange?: (state: T) => void;
};

const CodeEditor = CodeEditorOverlay as unknown as React.ComponentType<BoardProps<CodeBoardState>>;
const STEMBoard = STEMBoardOverlay as unknown as React.ComponentType<BoardProps<STEMBoardState>>;
const DesignBoard = DesignStudioOverlay as unknown as React.ComponentType<BoardProps<DesignBoardState>>;

type WhiteboardMode = null | WhiteboardKind;
type AnnotTool = 'pointer' | AnnotationTool;

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
  autoConnect?: boolean;
}

interface ParticipantInfo {
  identity: string;
  name: string;
  isLocal: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  isSpeaking: boolean;
}

const ANNOT_TOOLS: { id: AnnotTool; icon: any; label: string }[] = [
  { id: 'pointer', icon: MousePointer2, label: 'Pointer' },
  { id: 'laser', icon: Sparkles, label: 'Laser' },
  { id: 'pen', icon: Pencil, label: 'Pen' },
  { id: 'highlighter', icon: Highlighter, label: 'Highlighter' },
  { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

const ANNOT_COLORS = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#ffffff', '#a855f7'];

/* ---------- Noise cancellation ---------- */
async function applyKrispNoiseFilter(track: LocalTrack): Promise<boolean> {
  try {
    const mod: any = await import('@livekit/krisp-noise-filter').catch(() => null);
    if (!mod || !mod.KrispNoiseFilter) return false;
    const filter = new mod.KrispNoiseFilter();
    if (typeof (track as any).setProcessor === 'function') {
      await (track as any).setProcessor(filter);
      return true;
    }
    return false;
  } catch {
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
  } catch {
    /* ignore */
  }
}

function newStrokeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/* ============================================================ */
export default function TeacherLiveKitClassroomLoader({
  assignmentId, roomName, teacherName,
  courseName, studentName,
  autoConnect = false,
}: Props) {
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const [micEnabled, setMicEnabled] = useState(false);
  const [camEnabled, setCamEnabled] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [noiseCancellation, setNoiseCancellation] = useState(true);

  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState('');

  const [whiteboard, setWhiteboard] = useState<WhiteboardMode>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSharingWhiteboard, setIsSharingWhiteboard] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [boardsSheetOpen, setBoardsSheetOpen] = useState(false);

  const [annotOpen, setAnnotOpen] = useState(false);
  const [annotTool, setAnnotTool] = useState<AnnotTool>('pen');
  const [annotColor, setAnnotColor] = useState('#ef4444');
  const [annotWidth, setAnnotWidth] = useState(3);
  const [, setAnnotTick] = useState(0);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localTracksRef = useRef<LocalTrack[]>([]);
  const remoteVideoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const roomRef = useRef<Room | null>(null);

  /* ✅ Connection guards — refs, not state */
  const isConnectingRef = useRef(false);
  const sessionIdRef = useRef(0);

  const boardStatesRef = useRef<Record<WhiteboardKind, any>>({ code: {}, design: {}, stem: {} });
  const lastBroadcastRef = useRef<Record<WhiteboardKind, number>>({ code: 0, design: 0, stem: 0 });
  const isSharingRef = useRef(false);
  const whiteboardRef = useRef<WhiteboardMode>(null);
  const noiseCancelRef = useRef(true);

  const transcriptSessionIdRef = useRef<string | null>(null);
  const classStartRef = useRef<number>(0);

  const annotCanvasRef = useRef<HTMLCanvasElement>(null);
  const annotStrokesRef = useRef<AnnotationStroke[]>([]);
  const annotCurrentRef = useRef<AnnotationStroke | null>(null);
  const annotLaserRef = useRef<{ point: AnnotationPoint; at: number } | null>(null);
  const annotLastLaserPubRef = useRef(0);
  const annotDrawingRef = useRef(false);
  const annotColorRef = useRef('#ef4444');

  useEffect(() => { isSharingRef.current = isSharingWhiteboard; }, [isSharingWhiteboard]);
  useEffect(() => { whiteboardRef.current = whiteboard; }, [whiteboard]);
  useEffect(() => { noiseCancelRef.current = noiseCancellation; }, [noiseCancellation]);
  useEffect(() => { annotColorRef.current = annotColor; }, [annotColor]);

  /* ✅ Attach local video after room is set (avoids race with ref) */
  useEffect(() => {
    if (!room) return;
    const localVideoTrack = localTracksRef.current.find(
      (t) => t.kind === Track.Kind.Video
    );
    if (localVideoTrack && localVideoRef.current) {
      try {
        localVideoTrack.attach(localVideoRef.current);
      } catch {
        /* ignore */
      }
    }
  }, [room, camEnabled]);

  /* ✅ Cleanup on tab close */
  useEffect(() => {
    const handler = () => {
      if (roomRef.current) {
        try { roomRef.current.disconnect(); } catch { /* ignore */ }
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  /* ---------- Transcript ---------- */
  const ensureTranscriptSession = useCallback(async (): Promise<string | null> => {
    if (transcriptSessionIdRef.current) return transcriptSessionIdRef.current;
    try {
      const res = await fetch('/api/livekit/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ assignmentId, roomName }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.id) return null;
      transcriptSessionIdRef.current = data.id;
      return data.id;
    } catch {
      return null;
    }
  }, [assignmentId, roomName]);

  useSilentTranscript({
    sessionIdRef: transcriptSessionIdRef,
    enabled: connectionState === ConnectionState.Connected,
    speakerRole: 'teacher',
    speakerName: teacherName || 'Teacher',
    lang: 'en-US',
    ensureSession: ensureTranscriptSession,
  });

  /* ---------- Whiteboard publishing ---------- */
  const publishWhiteboardMessage = useCallback(async (message: WhiteboardMessage) => {
    const r = roomRef.current;
    if (!r) return;
    try {
      const payload = new Uint8Array(encodeMessage(message));
      await r.localParticipant.publishData(payload, { reliable: true, topic: WHITEBOARD_TOPIC });
    } catch (err) {
      console.warn('[WB] publish failed:', err);
    }
  }, []);

  const openWhiteboard = useCallback((board: WhiteboardKind) => {
    setWhiteboard(board);
    setBoardsSheetOpen(false);
    if (isSharingRef.current) {
      publishWhiteboardMessage({
        type: 'wb-open',
        board,
        state: boardStatesRef.current[board] || {},
        senderName: teacherName,
      });
    }
  }, [publishWhiteboardMessage, teacherName]);

  const closeWhiteboard = useCallback(() => {
    const current = whiteboardRef.current;
    setWhiteboard(null);
    if (current && isSharingRef.current) {
      publishWhiteboardMessage({ type: 'wb-close', board: current });
    }
  }, [publishWhiteboardMessage]);

  const handleBoardStateChange = useCallback((board: WhiteboardKind, state: any) => {
    boardStatesRef.current[board] = state;
    if (!isSharingRef.current || whiteboardRef.current !== board) return;
    const now = Date.now();
    const minInterval = board === 'design' ? 66 : 200;
    if (now - lastBroadcastRef.current[board] < minInterval) return;
    lastBroadcastRef.current[board] = now;
    publishWhiteboardMessage({ type: 'wb-state', board, state });
  }, [publishWhiteboardMessage]);

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
      await publishWhiteboardMessage({ type: 'wb-close', board: currentBoard });
    }
  }, [publishWhiteboardMessage, teacherName]);

  /* ---------- Annotation publishing ---------- */
  const publishAnnotation = useCallback((msg: AnnotationMessage) => {
    const r = roomRef.current;
    if (!r) return;
    try {
      const payload = new Uint8Array(encodeAnnotation(msg));
      r.localParticipant.publishData(payload, {
        reliable: true,
        topic: ANNOTATION_TOPIC,
      });
    } catch (err) {
      console.warn('[annotation] publish failed:', err);
    }
  }, []);

  /* ---------- Annotation canvas redraw ---------- */
  const redrawAnnotation = useCallback(() => {
    const canvas = annotCanvasRef.current;
    const container = videoContainerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (
      canvas.width !== Math.floor(w * dpr) ||
      canvas.height !== Math.floor(h * dpr)
    ) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    for (const s of annotStrokesRef.current) {
      drawAnnotationStroke(ctx, s, w, h);
    }
    if (annotCurrentRef.current) {
      drawAnnotationStroke(ctx, annotCurrentRef.current, w, h);
    }

    const laser = annotLaserRef.current;
    if (laser && Date.now() - laser.at < 1200) {
      drawLaser(ctx, laser.point, annotColorRef.current, w, h, 26);
    }
  }, []);

  useEffect(() => {
    if (!annotOpen) return;
    let running = true;
    const loop = () => {
      if (!running) return;
      redrawAnnotation();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => { running = false; };
  }, [annotOpen, redrawAnnotation]);

  useEffect(() => {
    if (!annotOpen) return;
    const onResize = () => redrawAnnotation();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setAnnotOpen(false); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (annotStrokesRef.current.length > 0) {
          annotStrokesRef.current = annotStrokesRef.current.slice(0, -1);
          publishAnnotation({ type: 'undo' });
          setAnnotTick((n) => n + 1);
        }
      }
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= ANNOT_TOOLS.length) {
        setAnnotTool(ANNOT_TOOLS[num - 1].id);
      }
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
    };
  }, [annotOpen, redrawAnnotation, publishAnnotation]);

  const annotGetPoint = (e: React.PointerEvent): AnnotationPoint | null => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const annotUndo = () => {
    if (annotStrokesRef.current.length === 0) return;
    annotStrokesRef.current = annotStrokesRef.current.slice(0, -1);
    publishAnnotation({ type: 'undo' });
    setAnnotTick((n) => n + 1);
  };

  const annotClear = () => {
    annotStrokesRef.current = [];
    annotCurrentRef.current = null;
    annotLaserRef.current = null;
    publishAnnotation({ type: 'clear' });
    setAnnotTick((n) => n + 1);
  };

  const annotOnPointerDown = (e: React.PointerEvent) => {
    if (annotTool === 'pointer') return;
    const p = annotGetPoint(e);
    if (!p) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    if (annotTool === 'laser') {
      annotLaserRef.current = { point: p, at: Date.now() };
      publishAnnotation({ type: 'laser', point: p, color: annotColor });
      return;
    }

    annotDrawingRef.current = true;
    annotCurrentRef.current = {
      id: newStrokeId(),
      tool: annotTool,
      color: annotColor,
      width:
        annotTool === 'highlighter'
          ? 6
          : annotTool === 'eraser'
          ? 24
          : annotWidth,
      points: [p],
    };
  };

  const annotOnPointerMove = (e: React.PointerEvent) => {
    const p = annotGetPoint(e);
    if (!p) return;

    if (annotTool === 'laser') {
      annotLaserRef.current = { point: p, at: Date.now() };
      const now = Date.now();
      if (now - annotLastLaserPubRef.current > 40) {
        annotLastLaserPubRef.current = now;
        publishAnnotation({ type: 'laser', point: p, color: annotColor });
      }
      return;
    }

    if (!annotDrawingRef.current || !annotCurrentRef.current) return;
    const pts = annotCurrentRef.current.points;
    const last = pts[pts.length - 1];
    const dx = p.x - last.x;
    const dy = p.y - last.y;
    if (dx * dx + dy * dy < 0.00002) return;
    pts.push(p);
  };

  const annotOnPointerUp = () => {
    if (annotTool === 'laser') return;
    if (!annotDrawingRef.current) return;
    annotDrawingRef.current = false;

    const stroke = annotCurrentRef.current;
    annotCurrentRef.current = null;
    if (!stroke || stroke.points.length === 0) return;

    const pathTool =
      stroke.tool === 'pen' ||
      stroke.tool === 'highlighter' ||
      stroke.tool === 'eraser';
    if (pathTool && stroke.points.length < 2) return;

    annotStrokesRef.current = [...annotStrokesRef.current, stroke];
    publishAnnotation({ type: 'add', stroke });
    setAnnotTick((n) => n + 1);
  };

  /* ---------- Noise cancellation toggle ---------- */
  const toggleNoiseCancellation = useCallback(async () => {
    const audioTrack = localTracksRef.current.find((t) => t.kind === Track.Kind.Audio);
    if (!audioTrack) return;
    const next = !noiseCancellation;
    try {
      if (next) {
        await applyKrispNoiseFilter(audioTrack);
        setNoiseCancellation(true);
      } else {
        await removeProcessor(audioTrack);
        setNoiseCancellation(false);
      }
    } catch {
      setNoiseCancellation(next);
    }
  }, [noiseCancellation]);

  /* ============================================================
     ✅ CONNECT — bulletproof version
     ============================================================ */
  const connectToRoom = useCallback(async () => {
    // ✅ Guard against double-connect (refs are synchronous)
    if (roomRef.current) return;
    if (isConnectingRef.current) return;

    isConnectingRef.current = true;
    setIsConnecting(true);
    setError('');

    const mySession = ++sessionIdRef.current;
    const isCurrent = () => sessionIdRef.current === mySession;

    let newRoom: Room | null = null;
    let tracks: LocalTrack[] = [];

    try {
      /* ---------- 1. Fetch token ---------- */
      const tokenRes = await fetch('/api/livekit/teacher-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ assignmentId, roomName }),
      });

      if (!isCurrent()) return;

      if (!tokenRes.ok) {
        const data = await tokenRes.json().catch(() => ({}));
        throw new Error(data?.error || `Token request failed (${tokenRes.status})`);
      }

      const { token, url } = await tokenRes.json();
      if (!token || !url) throw new Error('Server did not return token or URL');

      if (!isCurrent()) return;

      /* ---------- 2. Create room ---------- */
      newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      /* ---------- 3. Participant refresh ---------- */
      const refresh = () => {
        if (!newRoom || roomRef.current !== newRoom) return;
        const list: ParticipantInfo[] = [];

        const local = newRoom.localParticipant;
        if (local) {
          const camPub = local.getTrackPublication(Track.Source.Camera);
          const micPub = local.getTrackPublication(Track.Source.Microphone);
          list.push({
            identity: local.identity,
            name: local.name || teacherName || 'You',
            isLocal: true,
            hasVideo: Boolean(camPub?.track && !camPub.isMuted),
            hasAudio: Boolean(micPub?.track && !micPub.isMuted),
            isSpeaking: local.isSpeaking,
          });
        }

        let count = 0;
        newRoom.remoteParticipants.forEach((p: RemoteParticipant) => {
          count++;
          const camPub = p.getTrackPublication(Track.Source.Camera);
          const micPub = p.getTrackPublication(Track.Source.Microphone);
          list.push({
            identity: p.identity,
            name: p.name || p.identity,
            isLocal: false,
            hasVideo: Boolean(camPub?.isSubscribed && !camPub.isMuted),
            hasAudio: Boolean(micPub?.isSubscribed && !micPub.isMuted),
            isSpeaking: p.isSpeaking,
          });
        });

        setParticipants(list);
        setStudentCount(count);
      };

      /* ---------- 4. Attach listeners (all with session check) ---------- */
      newRoom
        .on(RoomEvent.Connected, () => {
          if (!isCurrent()) return;
          setConnectionState(ConnectionState.Connected);
          refresh();
        })
        .on(RoomEvent.Disconnected, () => {
          if (!isCurrent()) return;
          setConnectionState(ConnectionState.Disconnected);
          if (roomRef.current === newRoom) {
            roomRef.current = null;
            setRoom(null);
          }
        })
        .on(RoomEvent.Reconnecting, () => {
          if (!isCurrent()) return;
          setConnectionState(ConnectionState.Reconnecting);
        })
        .on(RoomEvent.Reconnected, () => {
          if (!isCurrent()) return;
          setConnectionState(ConnectionState.Connected);
        })
        .on(RoomEvent.ParticipantConnected, () => {
          if (!isCurrent()) return;
          refresh();
          if (isSharingRef.current && whiteboardRef.current) {
            publishWhiteboardMessage({
              type: 'wb-open',
              board: whiteboardRef.current,
              state: boardStatesRef.current[whiteboardRef.current] || {},
              senderName: teacherName,
            });
          }
          if (annotStrokesRef.current.length > 0) {
            publishAnnotation({ type: 'resync', strokes: annotStrokesRef.current });
          }
        })
        .on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
          if (!isCurrent()) return;
          const v = remoteVideoElementsRef.current.get(p.identity);
          if (v) { v.remove(); remoteVideoElementsRef.current.delete(p.identity); }
          const a = remoteAudioElementsRef.current.get(p.identity);
          if (a) { a.remove(); remoteAudioElementsRef.current.delete(p.identity); }
          refresh();
        })
        .on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub, participant) => {
          if (!isCurrent()) return;
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
          refresh();
        })
        .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, _pub, participant) => {
          if (!isCurrent()) return;
          track.detach();
          if (track.kind === Track.Kind.Video) {
            const el = remoteVideoElementsRef.current.get(participant.identity);
            if (el) { el.remove(); remoteVideoElementsRef.current.delete(participant.identity); }
          } else if (track.kind === Track.Kind.Audio) {
            const el = remoteAudioElementsRef.current.get(participant.identity);
            if (el) { el.remove(); remoteAudioElementsRef.current.delete(participant.identity); }
          }
          refresh();
        })
        .on(RoomEvent.TrackMuted, () => { if (isCurrent()) refresh(); })
        .on(RoomEvent.TrackUnmuted, () => { if (isCurrent()) refresh(); })
        .on(RoomEvent.LocalTrackPublished, () => { if (isCurrent()) refresh(); })
        .on(RoomEvent.LocalTrackUnpublished, () => { if (isCurrent()) refresh(); })
        .on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
          if (!isCurrent()) return;
          setActiveSpeaker(speakers.length > 0 ? speakers[0].identity : '');
        });

      /* ---------- 5. Connect ---------- */
      await newRoom.connect(url, token);

      if (!isCurrent()) {
        try { await newRoom.disconnect(); } catch { /* ignore */ }
        return;
      }

      /* ---------- 6. Set room ref NOW (before tracks) ---------- */
      roomRef.current = newRoom;

      /* ---------- 7. Create local tracks ---------- */
      try {
        tracks = await createLocalTracks({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: { resolution: { width: 1280, height: 720 } },
        });
      } catch {
        try {
          tracks = await createLocalTracks({ audio: true, video: false });
        } catch {
          tracks = [];
        }
      }

      if (!isCurrent()) {
        tracks.forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
        return;
      }

      localTracksRef.current = tracks;

      /* ---------- 8. Apply noise filter ---------- */
      if (noiseCancelRef.current) {
        const audioTrack = tracks.find((t) => t.kind === Track.Kind.Audio);
        if (audioTrack) {
          const ok = await applyKrispNoiseFilter(audioTrack);
          if (!ok) setNoiseCancellation(false);
        }
      }

      /* ---------- 9. ✅ Publish FIRST (tracks are enabled) ---------- */
      for (const t of tracks) {
        try {
          await newRoom.localParticipant.publishTrack(t);
        } catch (pubErr) {
          console.warn('[LiveKit] publishTrack failed:', pubErr);
        }
      }

      /* ---------- 10. ✅ THEN mute ---------- */
      for (const t of tracks) {
        try { await t.mute(); } catch { /* ignore */ }
      }

      /* ---------- 11. Attach local video ---------- */
      const localVideoTrack = tracks.find((t) => t.kind === Track.Kind.Video);
      if (localVideoTrack && localVideoRef.current) {
        try { localVideoTrack.attach(localVideoRef.current); } catch { /* ignore */ }
      }

      /* ---------- 12. Set final state ---------- */
      setMicEnabled(false);
      setCamEnabled(false);
      setRoom(newRoom);
      refresh();

      classStartRef.current = Date.now();
      void ensureTranscriptSession();
    } catch (err: any) {
      console.error('[LiveKit] Connection error:', err);
      if (isCurrent()) {
        setError(err?.message || 'Failed to connect');
        setConnectionState(ConnectionState.Disconnected);
      }
      if (newRoom) {
        try { await newRoom.disconnect(); } catch { /* ignore */ }
      }
      if (roomRef.current === newRoom) roomRef.current = null;
    } finally {
      if (isCurrent()) {
        isConnectingRef.current = false;
        setIsConnecting(false);
      }
    }
  }, [
    assignmentId, roomName, teacherName,
    publishWhiteboardMessage, publishAnnotation, ensureTranscriptSession,
  ]);

  /* ---------- Auto-connect ---------- */
  useEffect(() => {
    if (!autoConnect) return;
    if (roomRef.current) return;
    if (isConnectingRef.current) return;
    void connectToRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);

  /* ============================================================
     ✅ DISCONNECT — clean up first, then kill everything
     ============================================================ */
  const disconnect = useCallback(async () => {
    const r = roomRef.current;

    // ✅ Invalidate any pending connect operations FIRST
    roomRef.current = null;
    sessionIdRef.current += 1;

    // ---------- Close transcript session ----------
    if (transcriptSessionIdRef.current) {
      const durationSec = classStartRef.current
        ? Math.floor((Date.now() - classStartRef.current) / 1000)
        : 0;
      const sid = transcriptSessionIdRef.current;
      transcriptSessionIdRef.current = null;
      try {
        fetch(`/api/livekit/transcript/${sid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ durationSec }),
          keepalive: true,
        }).catch(() => {});
      } catch { /* ignore */ }
    }

    // ---------- Stop local tracks ----------
    localTracksRef.current.forEach((t) => {
      try { t.stop(); t.detach(); } catch { /* ignore */ }
    });
    localTracksRef.current = [];

    // ---------- Remove remote media elements ----------
    remoteVideoElementsRef.current.forEach((el) => el.remove());
    remoteVideoElementsRef.current.clear();
    remoteAudioElementsRef.current.forEach((el) => el.remove());
    remoteAudioElementsRef.current.clear();

    // ---------- Disconnect room ----------
    if (r) {
      try { await r.disconnect(); } catch { /* ignore */ }
    }

    // ---------- Reset all state ----------
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
    setAnnotOpen(false);
    annotStrokesRef.current = [];
  }, []);

  /* ---------- Component unmount cleanup ---------- */
  useEffect(() => {
    return () => {
      const r = roomRef.current;
      roomRef.current = null;
      sessionIdRef.current += 1;

      if (transcriptSessionIdRef.current) {
        const durationSec = classStartRef.current
          ? Math.floor((Date.now() - classStartRef.current) / 1000)
          : 0;
        const sid = transcriptSessionIdRef.current;
        transcriptSessionIdRef.current = null;
        try {
          fetch(`/api/livekit/transcript/${sid}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ durationSec }),
            keepalive: true,
          }).catch(() => {});
        } catch { /* ignore */ }
      }

      localTracksRef.current.forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
      localTracksRef.current = [];
      remoteVideoElementsRef.current.forEach((el) => el.remove());
      remoteVideoElementsRef.current.clear();
      remoteAudioElementsRef.current.forEach((el) => el.remove());
      remoteAudioElementsRef.current.clear();
      if (r) { try { r.disconnect(); } catch { /* ignore */ } }
    };
  }, []);

  /* ---------- Media toggles ---------- */
  const toggleMic = useCallback(async () => {
    if (!roomRef.current) return;
    const t = localTracksRef.current.find((x) => x.kind === Track.Kind.Audio);
    if (!t) return;
    try {
      if (micEnabled) { await t.mute(); setMicEnabled(false); }
      else { await t.unmute(); setMicEnabled(true); }
    } catch (e) { console.error('[mic toggle]', e); }
  }, [micEnabled]);

  const toggleCam = useCallback(async () => {
    if (!roomRef.current) return;
    const t = localTracksRef.current.find((x) => x.kind === Track.Kind.Video);
    if (!t) return;
    try {
      if (camEnabled) { await t.mute(); setCamEnabled(false); }
      else { await t.unmute(); setCamEnabled(true); }
    } catch (e) { console.error('[cam toggle]', e); }
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
      if (err?.name !== 'NotAllowedError') {
        setError('Screen sharing failed. Please allow screen access.');
        setTimeout(() => setError(''), 4000);
      }
    }
  }, [screenSharing]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await videoContainerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const remoteParticipants = useMemo(
    () => participants.filter((p) => !p.isLocal),
    [participants]
  );

  const connected = connectionState === ConnectionState.Connected;
  const reconnecting = connectionState === ConnectionState.Reconnecting;

  /* ============================================================
     RENDER — Connecting
     ============================================================ */
  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mx-auto" />
          <h3 className="mt-4 text-base font-semibold text-white">Joining class...</h3>
          <p className="text-xs text-white/50 mt-1">Setting up camera and microphone</p>
        </div>
      </div>
    );
  }

  /* ============================================================
     RENDER — Error
     ============================================================ */
  if (error && !room) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="max-w-sm text-center">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
          <h3 className="mt-4 text-base font-semibold text-white">Could not connect</h3>
          <p className="text-xs text-white/60 mt-2 break-words">{error}</p>
          <button
            type="button"
            onClick={() => { setError(''); void connectToRoom(); }}
            className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* ============================================================
     RENDER — Ready
     ============================================================ */
  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="max-w-sm text-center">
          <VideoIcon className="h-12 w-12 text-emerald-500 mx-auto" />
          <h3 className="mt-4 text-lg font-semibold text-white">Ready to start?</h3>
          <p className="text-sm text-white/60 mt-1">
            You&apos;ll join as host. Camera and mic start muted.
          </p>
          <button
            type="button"
            onClick={() => void connectToRoom()}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition"
          >
            <VideoIcon className="h-4 w-4" />
            Start class
          </button>
        </div>
      </div>
    );
  }

  /* ============================================================
     RENDER — Connected
     ============================================================ */
  return (
    <>
      <div className="rounded-none sm:rounded-2xl bg-slate-900 overflow-hidden sm:border sm:border-slate-800 sm:shadow-2xl">
        {/* TOP BAR */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-950/80 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {connected ? (
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            ) : reconnecting ? (
              <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin shrink-0" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-rose-400 shrink-0" />
            )}

            <span className="text-xs font-semibold text-white/90 truncate">{courseName}</span>
            <span className="text-white/30 hidden sm:inline">·</span>
            <span className="text-xs text-white/50 truncate hidden sm:inline">{studentName}</span>

            {annotOpen && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold uppercase">
                <Pencil className="h-3 w-3" />
                <span className="hidden sm:inline">Drawing</span>
              </span>
            )}

            {isSharingWhiteboard && whiteboard && (
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-400/40 text-violet-200 text-[10px] font-bold uppercase">
                Sharing {whiteboard}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowParticipants((v) => !v)}
              className={`inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-bold transition ${
                showParticipants ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>{participants.length}</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="hidden sm:inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* VIDEO AREA */}
        <div
          ref={videoContainerRef}
          className="relative bg-slate-950 aspect-video max-h-[60vh] sm:max-h-[70vh] overflow-hidden"
        >
          <div
            className={`absolute inset-0 p-1.5 sm:p-2 grid gap-1.5 sm:gap-2 ${
              remoteParticipants.length <= 1 ? 'grid-cols-1'
              : remoteParticipants.length <= 4 ? 'grid-cols-2'
              : 'grid-cols-2 md:grid-cols-3'
            }`}
          >
            {remoteParticipants.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                    <UserCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-white/30" />
                  </div>
                  <p className="text-white/70 text-sm font-semibold">Waiting for student...</p>
                  <p className="text-white/30 text-xs mt-1">Room is live</p>
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
          <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-24 sm:w-40 lg:w-56 aspect-video rounded-lg sm:rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-800 z-10">
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
                <VideoOff className="h-5 w-5 sm:h-8 sm:w-8 text-white/30 mx-auto" />
              </div>
            )}
            {!micEnabled && (
              <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-rose-600 flex items-center justify-center">
                <MicOff className="h-2.5 w-2.5 text-white" />
              </div>
            )}
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm">
              <p className="text-[9px] sm:text-[10px] font-bold text-white">You</p>
            </div>
          </div>

          {/* ANNOTATION LAYER */}
          {annotOpen && connected && (
            <div className="absolute inset-0 z-20" style={{ touchAction: 'none' }}>
              <canvas
                ref={annotCanvasRef}
                className="absolute inset-0 w-full h-full touch-none select-none"
                style={{ cursor: annotTool === 'pointer' ? 'default' : 'crosshair' }}
                onPointerDown={annotOnPointerDown}
                onPointerMove={annotOnPointerMove}
                onPointerUp={annotOnPointerUp}
                onPointerCancel={annotOnPointerUp}
              />

              <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/85 backdrop-blur-md text-white/80 text-[10px] font-medium px-2.5 py-1 rounded-full border border-white/10 hidden sm:block">
                Draw on the screen — students see it live
              </div>

              <div className="absolute top-1 sm:top-2 inset-x-1 sm:inset-x-2 flex flex-col items-center gap-1 sm:gap-1.5">
                <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl px-1.5 py-1 flex items-center gap-0.5 max-w-full overflow-x-auto">
                  {ANNOT_TOOLS.map((t) => {
                    const Icon = t.icon;
                    const active = annotTool === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAnnotTool(t.id)}
                        title={t.label}
                        className={[
                          'shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-lg transition active:scale-95',
                          active ? 'bg-emerald-500 text-white shadow-md' : 'text-white/70 hover:bg-white/10',
                        ].join(' ')}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}

                  <div className="shrink-0 w-px h-5 bg-white/10 mx-0.5" />

                  <button
                    type="button"
                    onClick={annotUndo}
                    disabled={annotStrokesRef.current.length === 0}
                    className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-lg text-white/70 hover:bg-white/10 disabled:opacity-30 transition"
                  >
                    <Undo2 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={annotClear}
                    disabled={annotStrokesRef.current.length === 0}
                    className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-lg text-white/70 hover:bg-white/10 disabled:opacity-30 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setAnnotOpen(false)}
                    className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl px-1.5 py-1 flex items-center gap-1">
                  {ANNOT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAnnotColor(c)}
                      aria-label={`Color ${c}`}
                      className={[
                        'h-6 w-6 rounded-full border-2 transition',
                        annotColor === c ? 'border-white scale-110' : 'border-white/20',
                      ].join(' ')}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CONTROL BAR */}
        <div className="bg-slate-950/80 border-t border-white/10">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 py-2 sm:py-4">
            <CtrlBtn onClick={toggleMic} on={micEnabled} danger={!micEnabled} title={micEnabled ? 'Mute' : 'Unmute'}>
              {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </CtrlBtn>

            <CtrlBtn onClick={toggleNoiseCancellation} on={noiseCancellation} accent="violet" title="Noise cancel">
              <AudioLines className="h-5 w-5" />
            </CtrlBtn>

            <CtrlBtn onClick={toggleCam} on={camEnabled} danger={!camEnabled} title={camEnabled ? 'Cam off' : 'Cam on'}>
              {camEnabled ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </CtrlBtn>

            <CtrlBtn onClick={toggleScreenShare} on={screenSharing} accent="emerald" title="Screen share">
              {screenSharing ? <MonitorOff className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
            </CtrlBtn>

            <button
              type="button"
              onClick={() => setAnnotOpen((v) => !v)}
              className={[
                'inline-flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-full transition active:scale-95',
                annotOpen
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-2 ring-amber-300/50'
                  : 'bg-white/10 text-white/80 hover:bg-white/20',
              ].join(' ')}
              title={annotOpen ? 'Close brush' : 'Draw / Annotate'}
            >
              <Pencil className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setBoardsSheetOpen(true)}
              className="sm:hidden inline-flex items-center justify-center h-11 w-11 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white transition active:scale-95"
            >
              <Palette className="h-5 w-5" />
            </button>

            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-px h-7 bg-white/10 mx-0.5" />

              <button
                type="button"
                onClick={toggleWhiteboardSharing}
                className={`inline-flex items-center gap-1.5 h-11 px-3.5 rounded-full text-xs font-bold transition active:scale-95 ${
                  isSharingWhiteboard
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50'
                    : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                }`}
              >
                {isSharingWhiteboard ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {isSharingWhiteboard ? 'Sharing' : 'Share'}
              </button>

              <button
                type="button"
                onClick={() => openWhiteboard('code')}
                className={`inline-flex items-center gap-1.5 h-11 px-3.5 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold transition active:scale-95 ${whiteboard === 'code' ? 'ring-2 ring-sky-400/60' : ''}`}
              >
                <Code2 className="h-4 w-4" />
                Code
              </button>

              <button
                type="button"
                onClick={() => openWhiteboard('stem')}
                className={`inline-flex items-center gap-1.5 h-11 px-3.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-bold transition active:scale-95 ${whiteboard === 'stem' ? 'ring-2 ring-violet-400/60' : ''}`}
              >
                <Zap className="h-4 w-4" />
                STEM
              </button>

              <button
                type="button"
                onClick={() => openWhiteboard('design')}
                className={`inline-flex items-center gap-1.5 h-11 px-3.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white text-xs font-bold transition active:scale-95 ${whiteboard === 'design' ? 'ring-2 ring-fuchsia-400/60' : ''}`}
              >
                <Palette className="h-4 w-4" />
                Design
              </button>
            </div>

            <button
              type="button"
              onClick={() => void disconnect()}
              className="ml-auto sm:ml-2 inline-flex items-center justify-center gap-1.5 h-11 px-3 sm:px-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-500/30 transition active:scale-95"
            >
              <PhoneOff className="h-4 w-4" />
              <span className="hidden sm:inline">End</span>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE BOARDS SHEET */}
      {boardsSheetOpen && (
        <div className="sm:hidden fixed inset-0 z-[110]">
          <div
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            onClick={() => setBoardsSheetOpen(false)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="pt-3 pb-2 flex justify-center">
              <div className="h-1.5 w-12 rounded-full bg-slate-300" />
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-slate-900">Boards</h3>
                <button
                  type="button"
                  onClick={() => setBoardsSheetOpen(false)}
                  className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"
                >
                  <X className="h-4 w-4 text-slate-600" />
                </button>
              </div>
              <button
                type="button"
                onClick={toggleWhiteboardSharing}
                className={`w-full mb-3 inline-flex items-center justify-between gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                  isSharingWhiteboard ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {isSharingWhiteboard ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {isSharingWhiteboard ? 'Sharing with students' : 'Not shared'}
                </span>
                <span className="text-xs opacity-70">{isSharingWhiteboard ? 'ON' : 'OFF'}</span>
              </button>
              <div className="grid grid-cols-3 gap-2">
                <BoardBtn color="from-sky-500 to-blue-600" icon={<Code2 className="h-5 w-5" />} label="Code" onClick={() => openWhiteboard('code')} />
                <BoardBtn color="from-violet-500 to-fuchsia-600" icon={<Zap className="h-5 w-5" />} label="STEM" onClick={() => openWhiteboard('stem')} />
                <BoardBtn color="from-fuchsia-500 to-pink-600" icon={<Palette className="h-5 w-5" />} label="Design" onClick={() => openWhiteboard('design')} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PARTICIPANTS PANEL */}
      {showParticipants && (
        <div className="fixed sm:top-20 sm:right-4 top-0 right-0 left-0 sm:left-auto z-[105] sm:w-72 bg-slate-900 border border-white/10 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-bold text-white">Participants ({participants.length})</span>
            </div>
            <button
              type="button"
              onClick={() => setShowParticipants(false)}
              className="text-white/40 hover:text-white/80 transition h-8 w-8 flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-2 space-y-1 max-h-[60vh] overflow-y-auto">
            {participants.map((p) => (
              <div key={p.identity} className="flex items-center gap-2 px-3 py-2 rounded-lg">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{p.name}</p>
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

      {/* ERROR TOAST */}
      {error && room && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] max-w-md mx-4">
          <div className="bg-rose-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm font-semibold flex-1">{error}</div>
            <button
              type="button"
              onClick={() => setError('')}
              className="text-white/80 hover:text-white shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* SHARING INDICATOR */}
      {isSharingWhiteboard && whiteboard && (
        <div className="fixed bottom-24 sm:bottom-4 left-1/2 sm:left-4 -translate-x-1/2 sm:translate-x-0 z-[100] flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-600 text-white shadow-2xl text-xs font-bold">
          <Share2 className="h-3.5 w-3.5" />
          Sharing {whiteboard} · {studentCount} student{studentCount !== 1 ? 's' : ''}
        </div>
      )}

      {/* WHITEBOARDS */}
      {whiteboard === 'code' && (
        <CodeEditor onClose={closeWhiteboard} onStateChange={(s) => handleBoardStateChange('code', s)} />
      )}
      {whiteboard === 'stem' && (
        <STEMBoard onClose={closeWhiteboard} onStateChange={(s) => handleBoardStateChange('stem', s)} />
      )}
      {whiteboard === 'design' && (
        <DesignBoard onClose={closeWhiteboard} onStateChange={(s) => handleBoardStateChange('design', s)} />
      )}
    </>
  );
}

/* ============================================================ */
/* Small components                                             */
/* ============================================================ */

function CtrlBtn({
  children, onClick, on, danger, accent, title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  on: boolean;
  danger?: boolean;
  accent?: 'violet' | 'emerald';
  title: string;
}) {
  const accentClasses =
    accent === 'violet'
      ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white ring-2 ring-violet-400/40'
      : accent === 'emerald'
      ? 'bg-emerald-600 text-white'
      : '';

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-full transition active:scale-95 ${
        danger
          ? 'bg-rose-600 text-white hover:bg-rose-700'
          : on && accentClasses
          ? accentClasses
          : on
          ? 'bg-white/10 text-white hover:bg-white/20'
          : 'bg-white/10 text-white/70 hover:bg-white/20'
      }`}
    >
      {children}
    </button>
  );
}

function BoardBtn({
  color, icon, label, onClick,
}: {
  color: string; icon: React.ReactNode; label: string; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-gradient-to-br ${color} text-white text-xs font-bold transition active:scale-95 shadow-lg`}
    >
      {icon}
      {label}
    </button>
  );
}

function RemoteVideoTile({
  participant, videoEl, isActiveSpeaker,
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
      className={`relative bg-slate-800 rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 ${
        isActiveSpeaker ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20' : 'ring-1 ring-white/5'
      }`}
    >
      <div ref={containerRef} className="w-full h-full" />

      {!videoEl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg sm:text-2xl font-bold shadow-2xl mx-auto">
              {participant.name.slice(0, 2).toUpperCase()}
            </div>
            <p className="text-white/40 text-[10px] sm:text-[11px] font-semibold mt-2 sm:mt-3">
              Camera off
            </p>
          </div>
        </div>
      )}

      <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-black/60 backdrop-blur-sm flex items-center gap-1.5">
        <p className="text-[10px] sm:text-xs font-bold text-white">{participant.name}</p>
        {isActiveSpeaker && (
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        )}
      </div>

      {!participant.hasAudio && (
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-rose-600 flex items-center justify-center shadow-lg">
          <MicOff className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
        </div>
      )}
    </div>
  );
}