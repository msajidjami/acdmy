'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  Sparkles, Send, Loader2, Lightbulb, BookOpen,
  GraduationCap, Calculator, ChevronRight, ChevronDown,
  Copy, Check, ListChecks, FunctionSquare, AlertCircle,
  CheckCircle2, ArrowRight, FlaskConical, Dna,
  Atom, Code, RefreshCw, Target, Layers, Play,
  Feather, PenTool, Brain, Quote, BookMarked,
  ScrollText, Scroll, Scale, Landmark,
  Sun, Moon, BookOpenCheck,
  type LucideIcon,
} from 'lucide-react';
import AutoVisualizer from './AutoVisualizer';

/* ============================================================
   TYPES
   ============================================================ */

interface Props {
  subject?: string;
  onClose?: () => void;
}

type Step = {
  step: number;
  title: string;
  explanation: string;
  formula?: string;
  calculation?: string;
  result?: string;
};

type Visual = {
  type: string;
  title?: string;
  description?: string;
  animation?: boolean;
  interactive?: boolean;
  labels?: string[];
  params?: Record<string, any>;
};

type AIResult = {
  title?: string;
  subject?: string;
  topic?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | string;
  explanation?: string;
  summary?: string;
  keyPoints?: string[];
  steps?: Step[];
  formula?: string;
  formulaExplanation?: string;
  answer?: string;
  visual?: Visual;
  examples?: string[];
  important?: string;
  conclusion?: string;
  vizType?: string;
  params?: Record<string, any>;
};

type Theme = 'dark' | 'light';

type SubjectDef = {
  id: string;
  label: string;
  labelEn: string;
  labelAr?: string;
  icon: LucideIcon;
  color: string;
  group: 'islamic' | 'stem';
  placeholder: string;
  examples: string[];
};

/* ============================================================
   THEME TOKENS
   ============================================================ */

const THEMES = {
  dark: {
    root: 'bg-[#0b1220] text-white',
    panel: 'bg-[#0f172a]',
    card: 'bg-[#0a0f1e]',
    subtle: 'bg-white/5 border-white/10',
    subtleHover: 'hover:bg-white/10',
    textPrimary: 'text-white',
    textMuted: 'text-white/70',
    textFaint: 'text-white/40',
    input: 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:bg-white/10',
    divider: 'border-white/10',
  },
  light: {
    root: 'bg-slate-50 text-slate-900',
    panel: 'bg-white',
    card: 'bg-white',
    subtle: 'bg-slate-100 border-slate-200',
    subtleHover: 'hover:bg-slate-200',
    textPrimary: 'text-slate-900',
    textMuted: 'text-slate-600',
    textFaint: 'text-slate-400',
    input: 'bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white',
    divider: 'border-slate-200',
  },
} as const;

/* Subject colors — `dark:` variant picks automatically once <html class="dark"> is set */
const SUBJECT_COLORS: Record<string, {
  solid: string; soft: string; text: string; border: string; bg: string; bgHover: string;
}> = {
  emerald: {
    solid: 'bg-emerald-500',
    soft: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-300',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/15',
    bgHover: 'hover:bg-emerald-500/20',
  },
  teal: {
    solid: 'bg-teal-500',
    soft: 'bg-teal-500/10',
    text: 'text-teal-600 dark:text-teal-300',
    border: 'border-teal-500/30',
    bg: 'bg-teal-500/15',
    bgHover: 'hover:bg-teal-500/20',
  },
  violet: {
    solid: 'bg-violet-500',
    soft: 'bg-violet-500/10',
    text: 'text-violet-600 dark:text-violet-300',
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/15',
    bgHover: 'hover:bg-violet-500/20',
  },
  fuchsia: {
    solid: 'bg-fuchsia-500',
    soft: 'bg-fuchsia-500/10',
    text: 'text-fuchsia-600 dark:text-fuchsia-300',
    border: 'border-fuchsia-500/30',
    bg: 'bg-fuchsia-500/15',
    bgHover: 'hover:bg-fuchsia-500/20',
  },
  amber: {
    solid: 'bg-amber-500',
    soft: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-300',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/15',
    bgHover: 'hover:bg-amber-500/20',
  },
  orange: {
    solid: 'bg-orange-500',
    soft: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-300',
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/15',
    bgHover: 'hover:bg-orange-500/20',
  },
  sky: {
    solid: 'bg-sky-500',
    soft: 'bg-sky-500/10',
    text: 'text-sky-600 dark:text-sky-300',
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/15',
    bgHover: 'hover:bg-sky-500/20',
  },
  indigo: {
    solid: 'bg-indigo-500',
    soft: 'bg-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-300',
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/15',
    bgHover: 'hover:bg-indigo-500/20',
  },
  cyan: {
    solid: 'bg-cyan-500',
    soft: 'bg-cyan-500/10',
    text: 'text-cyan-600 dark:text-cyan-300',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/15',
    bgHover: 'hover:bg-cyan-500/20',
  },
  rose: {
    solid: 'bg-rose-500',
    soft: 'bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-300',
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/15',
    bgHover: 'hover:bg-rose-500/20',
  },
};

/* ============================================================
   SUBJECTS
   ============================================================ */

const SUBJECTS: SubjectDef[] = [
  /* ---------- علومِ اسلامیہ ---------- */
  { id: 'sarf',        label: 'صرف',         labelEn: 'Sarf',            labelAr: 'الصرف',        icon: Feather,    color: 'emerald', group: 'islamic',
    placeholder: 'مثلاً: کَتَبَ، یَکْتُبُ، اسم فاعل، ثلاثی مجرد...',
    examples: ['کَتَبَ یَکْتُبُ', 'اسم فاعل', 'اسم مفعول', 'ثلاثی مجرد', 'باب افتعال'] },
  { id: 'nahw',        label: 'نحو',         labelEn: 'Nahw',            labelAr: 'النحو',        icon: PenTool,    color: 'teal',    group: 'islamic',
    placeholder: 'مثلاً: مبتدأ و خبر، فاعل و مفعول، جار مجرور...',
    examples: ['مبتدأ و خبر', 'فاعل و مفعول', 'جار مجرور', 'إنّ و اسمہا', 'کان و اسمہا'] },
  { id: 'mantiq',      label: 'منطق',        labelEn: 'Mantiq',          labelAr: 'المنطق',       icon: Brain,      color: 'violet',  group: 'islamic',
    placeholder: 'مثلاً: قیاس، استقراء، تمثیل، شرطیہ...',
    examples: ['قیاس منطقی', 'استقراء', 'تمثیل', 'شرطیہ متصلہ', 'کلیات خمس'] },
  { id: 'balagha',     label: 'بلاغت',       labelEn: 'Balagha',         labelAr: 'البلاغة',      icon: Quote,      color: 'fuchsia', group: 'islamic',
    placeholder: 'مثلاً: تشبیہ، استعارہ، کنایہ، مجاز...',
    examples: ['تشبیہ', 'استعارہ', 'کنایہ', 'مجاز مرسل', 'طباق', 'جناس'] },
  { id: 'tafsir',      label: 'تفسیر',       labelEn: 'Tafsir',          labelAr: 'التفسير',      icon: BookOpen,   color: 'amber',   group: 'islamic',
    placeholder: 'مثلاً: سورۃ الفاتحہ، آیت الکرسی...',
    examples: ['سورۃ الفاتحہ', 'آیت الکرسی', 'سورۃ الاخلاص', 'آیت النور', 'سورۃ یٰسین'] },
  { id: 'usul-tafsir', label: 'اصولِ تفسیر', labelEn: 'Usul al-Tafsir',  labelAr: 'أصول التفسير', icon: BookMarked, color: 'orange',  group: 'islamic',
    placeholder: 'مثلاً: اسباب نزول، ناسخ و منسوخ، محکم و متشابہ...',
    examples: ['اسباب نزول', 'ناسخ و منسوخ', 'محکم و متشابہ', 'مکی و مدنی', 'قراءات'] },
  { id: 'hadith',      label: 'حدیث',        labelEn: 'Hadith',          labelAr: 'الحديث',       icon: ScrollText, color: 'emerald', group: 'islamic',
    placeholder: 'مثلاً: حدیثِ جبریل، اربعین نووی، حدیثِ ثقلین...',
    examples: ['حدیثِ جبریل', 'اربعین نووی', 'حدیثِ ثقلین', 'صحیح بخاری', 'موطا امام مالک'] },
  { id: 'usul-hadith', label: 'اصولِ حدیث',  labelEn: 'Usul al-Hadith',  labelAr: 'أصول الحديث',  icon: Scroll,     color: 'teal',    group: 'islamic',
    placeholder: 'مثلاً: صحیح، حسن، ضعیف، موضوع...',
    examples: ['صحیح', 'حسن', 'ضعیف', 'موضوع', 'سند اور متن', 'جرح و تعدیل'] },
  { id: 'fiqh',        label: 'فقہ',         labelEn: 'Fiqh',            labelAr: 'الفقه',        icon: Scale,      color: 'sky',     group: 'islamic',
    placeholder: 'مثلاً: نماز، روزہ، زکوٰۃ، حج...',
    examples: ['نماز کے ارکان', 'روزے کے احکام', 'زکوٰۃ کا نصاب', 'حج کے مناسک', 'نکاح'] },
  { id: 'aqeedah',     label: 'عقیدہ',       labelEn: 'Aqeedah',         labelAr: 'العقيدة',      icon: Landmark,   color: 'indigo',  group: 'islamic',
    placeholder: 'مثلاً: توحید، رسالت، آخرت، قدر...',
    examples: ['توحید', 'رسالت', 'آخرت', 'قدر', 'ایمان کے ارکان', 'اسماء و صفات'] },

  /* ---------- سائنس و ریاضی ---------- */
  { id: 'math',        label: 'ریاضی',       labelEn: 'Mathematics',                              icon: Calculator, color: 'sky',     group: 'stem',
    placeholder: 'مثلاً: 5+3، x²+2x+1، sin θ...',
    examples: ['5 + 3', '12 \\div 3', 'x^2 + 2x + 1', 'a^2 + b^2 = c^2', 'e^{i\\pi}+1=0'] },
  { id: 'physics',     label: 'فزکس',        labelEn: 'Physics',                                  icon: Atom,       color: 'violet',  group: 'stem',
    placeholder: 'مثلاً: F = ma، E = mc²، PV = nRT...',
    examples: ['F = ma', 'E = mc^2', 'PV = nRT', 'v = u + at', 'F = G\\frac{m_1 m_2}{r^2}'] },
  { id: 'chemistry',   label: 'کیمسٹری',     labelEn: 'Chemistry',                                icon: FlaskConical, color: 'amber', group: 'stem',
    placeholder: 'مثلاً: H₂O، 2H₂ + O₂ → 2H₂O...',
    examples: ['H_2O', '2H_2 + O_2 \\to 2H_2O', 'NaCl', 'C_6H_{12}O_6', 'pH = -\\log[H^+]'] },
  { id: 'biology',     label: 'بیالوجی',     labelEn: 'Biology',                                  icon: Dna,        color: 'emerald', group: 'stem',
    placeholder: 'مثلاً: DNA، photosynthesis، mitosis...',
    examples: ['DNA structure', 'photosynthesis', 'mitosis', 'Krebs cycle', 'neuron'] },
  { id: 'computer',    label: 'کمپیوٹر',     labelEn: 'Computer Science',                         icon: Code,       color: 'cyan',    group: 'stem',
    placeholder: 'مثلاً: binary search، Big-O...',
    examples: ['binary search', 'bubble sort', 'Big-O notation', 'recursion', 'linked list'] },
];

const GROUPS = [
  { id: 'islamic' as const, label: 'علومِ اسلامیہ', labelEn: 'Islamic Sciences', icon: BookOpenCheck },
  { id: 'stem' as const,    label: 'سائنس و ریاضی', labelEn: 'Science & Math',   icon: Atom },
];

/* ============================================================
   HELPERS
   ============================================================ */

function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text || '');
}

function renderLatex(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
      output: 'html',
    });
  } catch {
    return `<span style="color:#f87171">Invalid formula</span>`;
  }
}

function Katex({ latex, block = false }: { latex: string; block?: boolean }) {
  const html = useMemo(() => renderLatex(latex, block), [latex, block]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function SmartMath({ text, block = false }: { text: string; block?: boolean }) {
  if (!text) return null;
  if (hasArabic(text)) {
    return (
      <span
        dir="rtl"
        className="font-medium leading-loose inline-block"
        style={{ fontFamily: "'Noto Naskh Arabic', 'Amiri', 'Jameel Noori Nastaleeq', serif" }}
      >
        {text}
      </span>
    );
  }
  return <Katex latex={text} block={block} />;
}

const DIFFICULTY = {
  beginner:     { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-300', border: 'border-emerald-500/30', label: 'Beginner',     labelUr: 'ابتدائی' },
  intermediate: { bg: 'bg-amber-500/15',   text: 'text-amber-600 dark:text-amber-300',     border: 'border-amber-500/30',   label: 'Intermediate', labelUr: 'درمیانہ' },
  advanced:     { bg: 'bg-rose-500/15',    text: 'text-rose-600 dark:text-rose-300',       border: 'border-rose-500/30',    label: 'Advanced',     labelUr: 'اعلیٰ' },
} as const;

function getDifficulty(d?: string) {
  if (d && d in DIFFICULTY) return DIFFICULTY[d as keyof typeof DIFFICULTY];
  return DIFFICULTY.beginner;
}

function getSubjectDef(id: string): SubjectDef {
  return SUBJECTS.find((s) => s.id === id) || SUBJECTS[0];
}

function subjectFromString(s: string): string {
  const v = (s || '').toLowerCase();
  if (v.includes('sarf') || v.includes('صرف')) return 'sarf';
  if (v.includes('nahw') || v.includes('نحو')) return 'nahw';
  if (v.includes('mantiq') || v.includes('منطق')) return 'mantiq';
  if (v.includes('balagh') || v.includes('بلاغ')) return 'balagha';
  if (v.includes('usul-tafsir') || v.includes('اصول تفسیر')) return 'usul-tafsir';
  if (v.includes('tafsir') || v.includes('تفسیر')) return 'tafsir';
  if (v.includes('usul-hadith') || v.includes('اصول حدیث')) return 'usul-hadith';
  if (v.includes('hadith') || v.includes('حدیث')) return 'hadith';
  if (v.includes('fiqh') || v.includes('فقہ')) return 'fiqh';
  if (v.includes('aqeedah') || v.includes('عقیدہ')) return 'aqeedah';
  if (v.includes('math') || v.includes('ریاضی')) return 'math';
  if (v.includes('physic') || v.includes('فزکس') || v.includes('طبیعیات')) return 'physics';
  if (v.includes('chem') || v.includes('کیمسٹری') || v.includes('کیمیا')) return 'chemistry';
  if (v.includes('bio') || v.includes('بیالوجی') || v.includes('حیاتیات')) return 'biology';
  if (v.includes('comp') || v.includes('cod') || v.includes('کمپیوٹر')) return 'computer';
  return 'math';
}

/* ============================================================
   MAIN
   ============================================================ */

export default function AIExplainPanel({ subject: initialSubject, onClose }: Props) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [subjectId, setSubjectId] = useState<string>(() => subjectFromString(initialSubject || ''));
  const [activeGroup, setActiveGroup] = useState<'islamic' | 'stem'>(() => {
    return getSubjectDef(subjectFromString(initialSubject || '')).group;
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSteps, setShowSteps] = useState(true);

  /* Make Tailwind `dark:` variants work — toggle the `dark` class on <html> */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  const t = THEMES[theme];
  const currentSubject = useMemo(() => getSubjectDef(subjectId), [subjectId]);
  const SubjectIcon = currentSubject.icon;
  const sc = SUBJECT_COLORS[currentSubject.color] || SUBJECT_COLORS.sky;
  const difficulty = getDifficulty(result?.difficulty);

  const filteredSubjects = useMemo(
    () => SUBJECTS.filter((s) => s.group === activeGroup),
    [activeGroup]
  );

  /* RTL if the current subject is Islamic, or the content contains Arabic script */
  const rtl = useMemo(() => {
    if (currentSubject.group === 'islamic') return true;
    const blob = (result?.explanation || '') + ' ' + (result?.title || '') + ' ' + input;
    return hasArabic(blob);
  }, [result, input, currentSubject]);

  const analyze = async (text: string) => {
    const value = text.trim();
    if (!value) return;
    setLoading(true);
    setError('');
    setResult(null);
    setCopied(false);

    try {
      const res = await fetch('/api/ai/stem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: value, subject: subjectId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'AI نے جواب نہیں دیا');
        return;
      }
      setResult(data);
    } catch (e: any) {
      setError(e?.message || 'نیٹ ورک کا مسئلہ');
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (!result) return;
    const text = [
      result.title ? `📖 ${result.title}` : '',
      result.summary ? `\n📌 ${result.summary}` : '',
      result.explanation ? `\n\n${result.explanation}` : '',
      result.formula ? `\n\nفارمولا: ${result.formula}` : '',
      result.answer ? `\nجواب: ${result.answer}` : '',
      result.conclusion ? `\n\n${result.conclusion}` : '',
    ].filter(Boolean).join('');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const switchGroup = (g: 'islamic' | 'stem') => {
    setActiveGroup(g);
    const first = SUBJECTS.find((s) => s.group === g);
    if (first) setSubjectId(first.id);
  };

  /* Visualization availability */
  const vizType = result?.visual?.type || result?.vizType;
  const vizParams = result?.visual?.params || result?.params || {};
  const hasVisual = !!vizType;

  return (
    <div
      className={`flex flex-col h-full ${t.root} transition-colors`}
      dir={rtl ? 'rtl' : 'ltr'}
      style={{
        fontFamily: rtl
          ? "'Noto Naskh Arabic', 'Amiri', 'Jameel Noori Nastaleeq', system-ui, sans-serif"
          : 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ============================================
          HEADER + INPUT
      ============================================ */}
      <div className={`shrink-0 border-b ${t.panel} ${t.divider}`}>
        <div className="p-3">

          {/* Title bar */}
          <div className="flex items-center gap-2 mb-3">
            <div className={`h-9 w-9 rounded-lg ${sc.solid} flex items-center justify-center shadow-sm shrink-0`}>
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${t.textPrimary}`}>
                {rtl ? 'اے آئی وضاحت کار' : 'AI Explainer'}
              </p>
              <p className={`text-[11px] ${t.textFaint} truncate`}>
                {rtl
                  ? 'کوئی بھی مسئلہ لکھیں — مرحلہ وار وضاحت اور اینیمیشن'
                  : 'Type any problem — step-by-step with animation'}
              </p>
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`h-8 w-8 rounded-lg flex items-center justify-center border ${t.subtle} ${t.subtleHover} transition shrink-0`}
              title={theme === 'dark' ? 'لائٹ موڈ' : 'ڈارک موڈ'}
              aria-label="Toggle theme"
            >
              {theme === 'dark'
                ? <Sun className="h-3.5 w-3.5 text-amber-400" />
                : <Moon className="h-3.5 w-3.5 text-slate-700" />}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className={`h-8 w-8 rounded-lg flex items-center justify-center border ${t.subtle} ${t.subtleHover} transition shrink-0`}
                aria-label="Close"
              >
                ✕
              </button>
            )}
          </div>

          {/* Group tabs */}
          <div className={`flex gap-1 mb-2 p-1 rounded-lg border ${t.subtle}`}>
            {GROUPS.map((g) => {
              const GIcon = g.icon;
              const active = activeGroup === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => switchGroup(g.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-bold transition ${
                    active
                      ? `${sc.solid} text-white shadow-sm`
                      : `${t.textMuted} ${t.subtleHover}`
                  }`}
                >
                  <GIcon className="h-3.5 w-3.5" />
                  <span>{g.label}</span>
                </button>
              );
            })}
          </div>

          {/* Subject chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-2 -mx-1 px-1">
            {filteredSubjects.map((sub) => {
              const Icon = sub.icon;
              const active = sub.id === subjectId;
              const c = SUBJECT_COLORS[sub.color];
              return (
                <button
                  key={sub.id}
                  onClick={() => setSubjectId(sub.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                    active
                      ? `${c.solid} text-white border-transparent shadow-sm`
                      : `${t.subtle} ${c.text} ${t.subtleHover}`
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{sub.label}</span>
                  <span className="text-[9px] opacity-70 hidden sm:inline">
                    {sub.labelEn}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); analyze(input); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentSubject.placeholder}
              disabled={loading}
              dir={rtl ? 'rtl' : 'ltr'}
              className={`flex-1 h-10 px-3 rounded-lg border outline-none text-sm transition ${t.input}`}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={`h-10 px-4 rounded-lg ${sc.solid} text-white text-sm font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm hover:opacity-90`}
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><Send className="h-3.5 w-3.5" /><span className="hidden sm:inline">{rtl ? 'پوچھیں' : 'Ask'}</span></>}
            </button>
          </form>

          {/* Examples */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {currentSubject.examples.map((ex) => (
              <button
                key={ex}
                onClick={() => { setInput(ex); analyze(ex); }}
                disabled={loading}
                dir={hasArabic(ex) ? 'rtl' : 'ltr'}
                className={`px-2 py-1 rounded-md text-[10px] border ${t.subtle} ${t.textMuted} ${t.subtleHover} transition disabled:opacity-50`}
              >
                {hasArabic(ex) ? ex : <Katex latex={ex} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================
          OUTPUT
      ============================================ */}
      <div className="flex-1 overflow-y-auto">

        {/* Error */}
        {error && (
          <div className={`m-3 p-3 rounded-lg border ${sc.border} ${sc.bg} text-sm flex items-start gap-2`}>
            <AlertCircle className={`h-4 w-4 shrink-0 mt-0.5 ${sc.text}`} />
            <span className={t.textPrimary}>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="relative">
              <div className={`h-14 w-14 rounded-xl ${sc.soft} flex items-center justify-center`}>
                <SubjectIcon className={`h-6 w-6 ${sc.text} animate-pulse`} />
              </div>
              <div className={`absolute inset-0 rounded-xl border-2 ${sc.border} animate-ping`} />
            </div>
            <p className={`text-sm font-bold ${t.textPrimary}`}>
              {rtl ? 'اے آئی سوچ رہا ہے...' : 'AI is thinking...'}
            </p>
            <p className={`text-xs ${t.textFaint}`}>
              {rtl
                ? `${currentSubject.label} کی وضاحت تیار ہو رہی ہے`
                : `Preparing ${currentSubject.labelEn} explanation`}
            </p>
          </div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-3 space-y-3"
            >
              {/* ---- TITLE ---- */}
              {(result.title || result.subject) && (
                <div className={`rounded-xl border ${t.panel} ${sc.border} p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`h-10 w-10 rounded-lg ${sc.solid} flex items-center justify-center shrink-0`}>
                        <SubjectIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {result.title && (
                          <h2 className={`text-base font-bold leading-tight ${t.textPrimary}`}>
                            {result.title}
                          </h2>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${sc.border} ${sc.text}`}>
                            {currentSubject.label}
                          </span>
                          {result.topic && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.subtle} ${t.textMuted}`}>
                              {result.topic}
                            </span>
                          )}
                          {result.difficulty && (
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${difficulty.border} ${difficulty.bg} ${difficulty.text}`}>
                              {rtl ? difficulty.labelUr : difficulty.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={copyResult}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center border ${t.subtle} ${t.subtleHover} transition shrink-0`}
                      title="کاپی کریں"
                    >
                      {copied
                        ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                        : <Copy className={`h-3.5 w-3.5 ${t.textMuted}`} />}
                    </button>
                  </div>
                </div>
              )}

              {/* ---- SUMMARY ---- */}
              {result.summary && (
                <div className={`rounded-xl border ${t.panel} ${sc.border} p-3 flex items-start gap-2`}>
                  <Target className={`h-4 w-4 shrink-0 mt-0.5 ${sc.text}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${sc.text}`}>
                      {rtl ? 'خلاصہ' : 'Summary'}
                    </p>
                    <p className={`text-sm font-semibold ${t.textPrimary}`}>
                      <SmartMath text={result.summary} />
                    </p>
                  </div>
                </div>
              )}

              {/* ---- EXPLANATION ---- */}
              {result.explanation && (
                <div className={`rounded-xl border ${t.panel} ${sc.border} p-3`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className={`h-3.5 w-3.5 ${sc.text}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${sc.text}`}>
                      {rtl ? 'تفصیلی وضاحت' : 'Explanation'}
                    </span>
                  </div>
                  <p
                    className={`text-sm leading-loose whitespace-pre-wrap ${t.textPrimary}`}
                    dir={hasArabic(result.explanation) ? 'rtl' : 'ltr'}
                  >
                    {result.explanation}
                  </p>
                </div>
              )}

              {/* ---- FORMULA ---- */}
              {result.formula && (
                <div className={`rounded-xl border ${t.card} ${t.divider} p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FunctionSquare className={`h-3.5 w-3.5 ${sc.text}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${sc.text}`}>
                      {rtl ? 'قاعدہ / فارمولا' : 'Formula'}
                    </span>
                  </div>
                  <div className={`text-center py-3 text-lg overflow-x-auto ${t.textPrimary}`}>
                    <SmartMath text={result.formula} block />
                  </div>
                  {result.formulaExplanation && (
                    <p className={`text-xs leading-relaxed mt-2 pt-2 border-t ${t.divider} ${t.textMuted}`}>
                      {result.formulaExplanation}
                    </p>
                  )}
                </div>
              )}

              {/* ---- VISUALIZATION (always shown) ---- */}
              <div className={`rounded-xl border ${t.card} ${t.divider} overflow-hidden`}>
                <div className={`px-3 py-2 flex items-center justify-between border-b ${t.divider}`}>
                  <div className="flex items-center gap-2">
                    <Play className={`h-3.5 w-3.5 ${sc.text}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${sc.text}`}>
                      {rtl ? 'بصری وضاحت' : 'Visualization'}
                    </span>
                  </div>
                  {hasVisual ? (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${sc.bg} ${sc.text}`}>
                      {rtl ? 'متحرک' : 'Live'}
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${t.subtle} ${t.textFaint}`}>
                      {rtl ? 'آسان خاکہ' : 'Simple'}
                    </span>
                  )}
                </div>

                {hasVisual ? (
                  <AutoVisualizer
                    vizType={vizType as string}
                    params={vizParams}
                  />
                ) : (
                  <div className={`p-8 text-center ${t.textFaint} text-xs`}>
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    {rtl
                      ? 'اس جواب کے لیے بصری خاکہ دستیاب نہیں — تفصیل اوپر موجود ہے'
                      : 'No visual available for this response — see explanation above'}
                  </div>
                )}
              </div>

              {/* ---- STEPS ---- */}
              {result.steps && result.steps.length > 0 && (
                <div className={`rounded-xl border ${t.panel} ${t.divider} overflow-hidden`}>
                  <button
                    onClick={() => setShowSteps((v) => !v)}
                    className={`w-full px-3 py-2.5 flex items-center justify-between ${t.subtleHover} transition`}
                  >
                    <div className="flex items-center gap-2">
                      <ListChecks className={`h-3.5 w-3.5 ${sc.text}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${sc.text}`}>
                        {rtl ? 'مرحلہ وار حل' : 'Step-by-step'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${sc.bg} ${sc.text}`}>
                        {result.steps.length}
                      </span>
                    </div>
                    {showSteps
                      ? <ChevronDown className={`h-3.5 w-3.5 ${t.textFaint}`} />
                      : <ChevronRight className={`h-3.5 w-3.5 ${t.textFaint}`} />}
                  </button>

                  <AnimatePresence initial={false}>
                    {showSteps && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className={`px-3 pb-3 space-y-2 border-t ${t.divider}`}>
                          {result.steps.map((step, i) => (
                            <div
                              key={i}
                              className={`rounded-lg border ${t.subtle} p-3 mt-2`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className={`h-6 w-6 rounded-full ${sc.solid} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                                  {step.step}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-bold mb-1 ${t.textPrimary}`}>
                                    {step.title}
                                  </p>
                                  {step.explanation && (
                                    <p
                                      className={`text-[11px] leading-loose mb-1.5 ${t.textMuted}`}
                                      dir={hasArabic(step.explanation) ? 'rtl' : 'ltr'}
                                    >
                                      {step.explanation}
                                    </p>
                                  )}
                                  {step.formula && (
                                    <div className={`rounded-md border ${t.divider} px-2.5 py-1.5 my-1.5 text-sm overflow-x-auto ${t.textPrimary}`}>
                                      <SmartMath text={step.formula} />
                                    </div>
                                  )}
                                  {step.calculation && (
                                    <p className={`text-[11px] font-mono ${sc.text}`}>
                                      {step.calculation}
                                    </p>
                                  )}
                                  {step.result && (
                                    <div className="mt-1.5 flex items-center gap-1.5">
                                      <ArrowRight className={`h-3 w-3 shrink-0 ${sc.text}`} />
                                      <span className={`text-xs font-bold ${sc.text}`}>
                                        <SmartMath text={step.result} />
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ---- KEY POINTS ---- */}
              {result.keyPoints && result.keyPoints.length > 0 && (
                <div className={`rounded-xl border ${t.panel} ${sc.border} p-3`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${sc.text}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${sc.text}`}>
                      {rtl ? 'اہم نکات' : 'Key Points'}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {result.keyPoints.map((point, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-2 text-xs leading-loose ${t.textMuted}`}
                        dir={hasArabic(point) ? 'rtl' : 'ltr'}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full mt-2 shrink-0 ${sc.solid}`} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ---- ANSWER ---- */}
              {result.answer && (
                <div className={`rounded-xl border-2 ${sc.border} ${sc.bg} p-4 text-center`}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CheckCircle2 className={`h-4 w-4 ${sc.text}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${sc.text}`}>
                      {rtl ? 'جواب' : 'Answer'}
                    </span>
                  </div>
                  <p className={`text-xl font-bold ${t.textPrimary}`}>
                    <SmartMath text={result.answer} block />
                  </p>
                </div>
              )}

              {/* ---- EXAMPLES ---- */}
              {result.examples && result.examples.length > 0 && (
                <div className={`rounded-xl border ${t.panel} ${t.divider} p-3`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className={`h-3.5 w-3.5 ${sc.text}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${sc.text}`}>
                      {rtl ? 'مزید مثالیں' : 'Examples'}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {result.examples.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => { setInput(ex); analyze(ex); }}
                        dir={hasArabic(ex) ? 'rtl' : 'ltr'}
                        className={`w-full ${hasArabic(ex) ? 'text-right' : 'text-left'} px-3 py-2 rounded-lg border text-sm transition ${t.subtle} ${t.textMuted} ${t.subtleHover}`}
                      >
                        <SmartMath text={ex} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ---- IMPORTANT ---- */}
              {result.important && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-rose-600 dark:text-rose-300 uppercase tracking-wider mb-0.5">
                      {rtl ? 'اہم تنبیہ' : 'Important'}
                    </p>
                    <p
                      className={`text-xs leading-loose ${t.textPrimary}`}
                      dir={hasArabic(result.important) ? 'rtl' : 'ltr'}
                    >
                      {result.important}
                    </p>
                  </div>
                </div>
              )}

              {/* ---- CONCLUSION ---- */}
              {result.conclusion && (
                <div className={`rounded-xl border ${t.panel} ${sc.border} p-3 flex items-start gap-2`}>
                  <GraduationCap className={`h-4 w-4 shrink-0 mt-0.5 ${sc.text}`} />
                  <div className="flex-1">
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${sc.text}`}>
                      {rtl ? 'نتیجہ' : 'Conclusion'}
                    </p>
                    <p
                      className={`text-sm leading-loose ${t.textPrimary}`}
                      dir={hasArabic(result.conclusion) ? 'rtl' : 'ltr'}
                    >
                      {result.conclusion}
                    </p>
                  </div>
                </div>
              )}

              {/* ---- NEW QUESTION ---- */}
              <button
                onClick={() => { setResult(null); setInput(''); setError(''); }}
                className={`w-full mt-2 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${t.subtle} ${t.textMuted} ${t.subtleHover}`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {rtl ? 'نیا سوال پوچھیں' : 'Ask another question'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!result && !loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-14 px-6 text-center gap-4"
          >
            <div className={`h-14 w-14 rounded-2xl ${sc.soft} flex items-center justify-center`}>
              <SubjectIcon className={`h-7 w-7 ${sc.text}`} />
            </div>
            <div>
              <p className={`text-base font-bold ${t.textPrimary}`}>
                {rtl
                  ? `${currentSubject.label} کے بارے میں پوچھیں`
                  : `Ask about ${currentSubject.labelEn}`}
              </p>
              <p className={`text-xs mt-1.5 max-w-xs leading-loose ${t.textFaint}`}>
                {rtl
                  ? 'کوئی قاعدہ، اصطلاح، آیت یا مسئلہ لکھیں — اے آئی مرحلہ وار وضاحت اور متحرک خاکے کے ساتھ سمجھائے گا'
                  : 'Type a formula, term, or problem — AI will explain step-by-step with an animated visual'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-md mt-2">
              {SUBJECTS.filter((s) => s.group === activeGroup).map((s) => {
                const Icon = s.icon;
                const c = SUBJECT_COLORS[s.color];
                return (
                  <button
                    key={s.id}
                    onClick={() => setSubjectId(s.id)}
                    className={`rounded-lg border p-2.5 flex flex-col items-center gap-1 transition ${t.subtle} ${t.subtleHover} ${c.text}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[10px] font-bold">{s.label}</span>
                    <span className="text-[9px] opacity-60">{s.labelEn}</span>
                  </button>
                );
              })}
            </div>

            <p className={`text-[10px] mt-2 ${t.textFaint}`}>
              {rtl
                ? 'عربی، اردو اور رومن اردو کی معاونت موجود ہے'
                : 'Supports Arabic, Urdu, Roman Urdu & English'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}