'use client';

import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';

type Options = {
  sessionIdRef: MutableRefObject<string | null>;
  enabled: boolean;
  speakerRole: 'teacher' | 'student';
  speakerName: string;
  lang?: string;
  ensureSession: () => Promise<string | null>;
};

export function useSilentTranscript({
  sessionIdRef,
  enabled,
  speakerRole,
  speakerName,
  lang = 'en-US',
  ensureSession,
}: Options) {
  const recogRef = useRef<any>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      runningRef.current = false;
      try { recogRef.current?.stop(); } catch { /* ignore */ }
      recogRef.current = null;
      return;
    }

    if (typeof window === 'undefined') return;

    const SR: any =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      console.warn('[transcript] Web Speech API not supported in this browser');
      return;
    }

    runningRef.current = true;
    const recog = new SR();
    recogRef.current = recog;
    recog.continuous = true;
    recog.interimResults = false;
    recog.lang = lang;

    const sendMessage = async (text: string, isFinal: boolean) => {
      if (!text.trim()) return;
      let sid = sessionIdRef.current;
      if (!sid) sid = await ensureSession();
      if (!sid) return;

      try {
        await fetch(`/api/livekit/transcript/${sid}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store',
          body: JSON.stringify({
            speakerRole,
            speakerName,
            text,
            isFinal,
          }),
        });
      } catch (err) {
        console.warn('[transcript] send failed:', err);
      }
    };

    recog.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const transcript = r[0]?.transcript || '';
        if (r.isFinal && transcript.trim()) {
          void sendMessage(transcript.trim(), true);
        }
      }
    };

    recog.onerror = (e: any) => {
      // 'no-speech' اور 'aborted' عام ہیں، نظر انداز کریں
      if (e?.error !== 'no-speech' && e?.error !== 'aborted') {
        console.warn('[transcript] error:', e?.error);
      }
    };

    recog.onend = () => {
      if (runningRef.current) {
        try { recog.start(); } catch { /* ignore */ }
      }
    };

    try { recog.start(); } catch { /* ignore */ }

    return () => {
      runningRef.current = false;
      try { recog.stop(); } catch { /* ignore */ }
      recogRef.current = null;
    };
  }, [enabled, speakerRole, speakerName, lang, ensureSession, sessionIdRef]);
}