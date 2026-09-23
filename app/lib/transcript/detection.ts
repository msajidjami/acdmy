import type { FlagCategory, FlagSeverity } from '@/models/ClassTranscript';

export interface DetectionFlag {
  severity: FlagSeverity;
  category: FlagCategory;
  reason: string;
  matchedText: string;
}

const PHONE_REGEX =
  /(?:\+?\d[\d\s\-().]{7,}\d)|(?:03\d{2}[\s\-]?\d{7})|(?:\b\d{10,13}\b)/g;

const URL_REGEX =
  /(?:https?:\/\/|www\.)[^\s]+|(?:wa\.me|t\.me|telegram\.me|api\.whatsapp\.com)\/[^\s]+/gi;

const POACHING_PHRASES = [
  'tuition', 'my tuition', 'private tuition', 'my academy', 'my own academy',
  'join my', 'join me', 'come to my', 'come to me', 'contact me', 'call me',
  'my number', 'personal number', 'my whatsapp', 'whatsapp me',
  'leave this academy', 'better academy', 'other academy', 'another academy',
  'switch to', 'outside the academy', 'outside class', 'individual classes',
  'directly contact', 'direct contact', 'privately',
  'ٹیوشن', 'میری ٹیوشن', 'میری اکیڈمی', 'دوسری اکیڈمی',
  'میرا نمبر', 'ذاتی نمبر', 'واٹس ایپ', 'مجھ سے رابطہ', 'میرے پاس آجاؤ',
];

const CONTACT_APPS = [
  'whatsapp', 'wa.me', 'telegram', 'imo', 'signal', 'skype',
  'facebook', 'instagram', 'snapchat', 'واٹس ایپ', 'ٹیلیگرام',
];

export function detectIssues(text: string): DetectionFlag[] {
  const flags: DetectionFlag[] = [];
  const lower = text.toLowerCase();

  const phones = text.match(PHONE_REGEX);
  if (phones) {
    for (const p of phones) {
      const digits = p.replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 15) {
        flags.push({
          severity: 'high',
          category: 'phone_number',
          reason: 'Phone / WhatsApp number shared',
          matchedText: p,
        });
      }
    }
  }

  const urls = text.match(URL_REGEX);
  if (urls) {
    for (const u of urls) {
      flags.push({
        severity: 'high',
        category: 'external_link',
        reason: 'External link shared',
        matchedText: u,
      });
    }
  }

  for (const kw of POACHING_PHRASES) {
    if (lower.includes(kw.toLowerCase())) {
      flags.push({
        severity: 'high',
        category: 'poaching',
        reason: `Poaching: "${kw}"`,
        matchedText: kw,
      });
    }
  }

  for (const kw of CONTACT_APPS) {
    if (!lower.includes(kw.toLowerCase())) continue;
    if (flags.some((f) => f.matchedText.toLowerCase() === kw.toLowerCase())) continue;
    flags.push({
      severity: 'medium',
      category: 'suspicious_contact',
      reason: `Contact app: "${kw}"`,
      matchedText: kw,
    });
  }

  return flags;
}

/* ---------- Owner view highlighting ---------- */

export interface HighlightSegment {
  text: string;
  flagged: boolean;
  reason?: string;
  severity?: FlagSeverity;
  category?: FlagCategory;
}

export function highlightText(text: string, flags: DetectionFlag[]): HighlightSegment[] {
  if (!flags.length) return [{ text, flagged: false }];
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sorted = [...flags].sort((a, b) => b.matchedText.length - a.matchedText.length);
  const pattern = new RegExp(`(${sorted.map((f) => esc(f.matchedText)).join('|')})`, 'gi');

  const segments: HighlightSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) segments.push({ text: text.slice(last, m.index), flagged: false });
    const matched = m[0];
    const flag = sorted.find((f) => f.matchedText.toLowerCase() === matched.toLowerCase());
    segments.push({
      text: matched,
      flagged: true,
      reason: flag?.reason,
      severity: flag?.severity,
      category: flag?.category,
    });
    last = m.index + matched.length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), flagged: false });
  return segments;
}

export function severityClasses(sev?: FlagSeverity): string {
  switch (sev) {
    case 'high':   return 'bg-red-200 text-red-900 border-b-2 border-red-500 font-semibold';
    case 'medium': return 'bg-amber-200 text-amber-900 border-b-2 border-amber-500';
    default:       return 'bg-yellow-200 text-yellow-900 border-b-2 border-yellow-500';
  }
}