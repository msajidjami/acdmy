'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import { detectIssues } from '@/app/lib/transcript/detection';

interface Options {
  sessionIdRef: MutableRefObject<string | null>;
  enabled: boolean;
  speakerRole: 'teacher' | 'student';
  speakerName: string;
  lang?: string;
  ensureSession: () => Promise<string | null>;
}

/**
 * 🕵️ مکمل خاموش — کوئی UI، کوئی toast، کوئی error نہیں۔
 * Web Speech API سے مائیک کی آواز ٹیکسٹ میں بدل کر MongoDB میں محفوظ کرتا ہے۔
 */
export function useSilentTranscript(opts: Options): void {
  const {
    sessionIdRef, enabled, speakerRole, speakerName,
    lang = 'en-US', ensureSession,
  } = opts;

  const recRef = useRef<any>(null);
  const shouldRunRef = useRef(false);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const saveEntry = (text: string, flags: any[]) => {
    queueRef.current = queueRef.current
      .then(async () => {
        const sid = sessionIdRef.current || (await ensureSession());
        if (!sid) return;
        try {
          await fetch(`/api/livekit/transcript/${sid}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ speakerRole, speakerName, text, flags }),
            keepalive: true,
          });
        } catch { /* silent */ }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR: any =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    rec.maxAlternatives = 1;

    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (!res.isFinal) continue;
        const text = String(res[0]?.transcript || '').trim();
        if (!text) continue;
        saveEntry(text, detectIssues(text));
      }
    };

    rec.onend = () => {
      if (shouldRunRef.current) {
        setTimeout(() => { try { rec.start(); } catch {} }, 400);
      }
    };

    rec.onerror = () => {}; // چپ

    recRef.current = rec;
    return () => {
      shouldRunRef.current = false;
      try { rec.stop(); } catch {}
      recRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, speakerRole, speakerName]);

  useEffect(() => {
    const rec = recRef.current;
    if (!rec) return;
    if (enabled) {
      shouldRunRef.current = true;
      try { rec.start(); } catch {}
    } else {
      shouldRunRef.current = false;
      try { rec.stop(); } catch {}
    }
  }, [enabled]);
}