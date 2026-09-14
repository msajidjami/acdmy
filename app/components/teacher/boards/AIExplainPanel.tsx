'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  Sparkles, Send, Loader2, Lightbulb, BookOpen,
  GraduationCap, Calculator, Zap, ChevronRight, ChevronDown,
  Copy, Check, ListChecks, FunctionSquare, AlertCircle,
  CheckCircle2, X, ArrowRight, Sigma, FlaskConical, Dna,
  Atom, Code, RefreshCw, History, Hash, Target,
  TrendingUp, Layers, Play,
} from 'lucide-react';
import AutoVisualizer from './AutoVisualizer';

/* ============================================================
   TYPES
   ============================================================ */

interface Props {
  subject: string;
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
  /* backward compat */
  vizType?: string;
  params?: Record<string, any>;
};

/* ============================================================
   HELPERS
   ============================================================ */

function isRTL(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
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

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  beginner: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-400/30',
    label: 'Beginner',
  },
  intermediate: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-400/30',
    label: 'Intermediate',
  },
  advanced: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-300',
    border: 'border-rose-400/30',
    label: 'Advanced',
  },
};

function getSubjectIcon(subject: string) {
  const s = (subject || '').toLowerCase();
  if (s.includes('math')) return Calculator;
  if (s.includes('physic')) return Atom;
  if (s.includes('chem')) return FlaskConical;
  if (s.includes('bio')) return Dna;
  if (s.includes('comp') || s.includes('cod')) return Code;
  return Sparkles;
}

/* ============================================================
   MAIN
   ============================================================ */

export default function AIExplainPanel({ subject }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSteps, setShowSteps] = useState(true);

  const examples = [
    '5 + 3',
    '12 ÷ 3',
    'x^2 + 2x + 1',
    'a² + b² = c²',
    'F = ma',
    'E = mc²',
    'H2O',
    '2H2 + O2 → 2H2O',
    'DNA structure',
    'photosynthesis',
  ];

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
        body: JSON.stringify({ input: value, subject }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'AI failed');
        return;
      }
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Network error');
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
      result.formula ? `\n\nFormula: ${result.formula}` : '',
      result.answer ? `\nAnswer: ${result.answer}` : '',
      result.conclusion ? `\n\n${result.conclusion}` : '',
    ]
      .filter(Boolean)
      .join('');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rtl = useMemo(
    () => isRTL((result?.explanation || '') + ' ' + (result?.title || '')),
    [result]
  );

  const difficulty = DIFFICULTY_COLORS[result?.difficulty || 'beginner'] || DIFFICULTY_COLORS.beginner;
  const SubjectIcon = getSubjectIcon(result?.subject || subject);

  return (
    <div className="flex flex-col h-full bg-[#0b1220]" dir={rtl ? 'rtl' : 'ltr'}>
      {/* ============================================
          INPUT AREA
      ============================================ */}
      <div className="p-3 border-b border-white/10 bg-[#0f172a] shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            className="h-8 w-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/30"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </motion.div>
          <div>
            <p className="text-xs font-bold text-white">AI Formula Explainer</p>
            <p className="text-[10px] text-white/40">
              Type any formula — AI will explain &amp; visualize
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            analyze(input);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. 5+3, x², F=ma, H₂O..."
              disabled={loading}
              className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-fuchsia-400/60 focus:bg-white/10 transition placeholder:text-white/30 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-10 px-4 rounded-lg bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-400 hover:to-pink-500 text-white text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-lg shadow-fuchsia-500/20"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ask</span>
              </>
            )}
          </button>
        </form>

        {/* Examples */}
        <div className="flex flex-wrap gap-1.5 mt-2.5 max-h-20 overflow-y-auto">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setInput(ex);
                analyze(ex);
              }}
              disabled={loading}
              className="px-2 py-1 rounded-md text-[10px] font-mono bg-white/5 hover:bg-fuchsia-500/20 hover:border-fuchsia-400/40 border border-white/10 text-white/60 hover:text-fuchsia-200 transition disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================
          OUTPUT
      ============================================ */}
      <div className="flex-1 overflow-y-auto">
        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="m-3 p-3 rounded-lg bg-rose-500/10 border border-rose-400/30 text-rose-200 text-xs flex items-start gap-2"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <motion.div
                className="h-16 w-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/30 to-pink-500/30 flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="h-7 w-7 text-fuchsia-300" />
              </motion.div>
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-fuchsia-400/40"
                animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white/80">
                AI is thinking...
              </p>
              <p className="text-xs text-white/40 mt-1">
                Analyzing formula &amp; building visualization
              </p>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {['Analyzing', 'Explaining', 'Visualizing'].map((label, i) => (
                <motion.div
                  key={label}
                  className="flex items-center gap-1"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
                >
                  <span className="text-[10px] text-white/50">{label}</span>
                  {i < 2 && <ChevronRight className="h-3 w-3 text-white/30" />}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="p-3 space-y-3"
            >
              {/* ---------- TITLE CARD ---------- */}
              {(result.title || result.subject) && (
                <div className="rounded-xl bg-gradient-to-br from-fuchsia-500/10 via-purple-500/5 to-pink-500/10 border border-fuchsia-400/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center shadow-md shrink-0">
                        <SubjectIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {result.title && (
                          <h2 className="text-base font-bold text-white leading-tight break-words">
                            {result.title}
                          </h2>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {result.subject && (
                            <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-bold text-white/70 uppercase tracking-wider">
                              {result.subject}
                            </span>
                          )}
                          {result.topic && (
                            <span className="px-2 py-0.5 rounded-full bg-violet-500/15 text-[10px] font-bold text-violet-300 uppercase tracking-wider">
                              {result.topic}
                            </span>
                          )}
                          {result.difficulty && (
                            <span
                              className={`px-2 py-0.5 rounded-full ${difficulty.bg} border ${difficulty.border} text-[10px] font-bold ${difficulty.text} uppercase tracking-wider`}
                            >
                              {difficulty.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={copyResult}
                      className="h-8 w-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition shrink-0"
                      title="Copy answer"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ---------- SUMMARY ---------- */}
              {result.summary && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                  className="rounded-xl bg-amber-500/10 border border-amber-400/30 p-3 flex items-start gap-2"
                >
                  <Target className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-0.5">
                      Summary
                    </p>
                    <p className="text-sm font-semibold text-white/90">
                      <Katex latex={result.summary} />
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ---------- EXPLANATION ---------- */}
              {result.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-xl bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10 border border-fuchsia-400/30 p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-[10px] font-bold text-fuchsia-300 uppercase tracking-wider">
                      Explanation
                    </span>
                  </div>
                  <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                    {result.explanation}
                  </p>
                </motion.div>
              )}

              {/* ---------- FORMULA (KaTeX) ---------- */}
              {result.formula && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-xl bg-[#0a0f1e] border border-sky-400/20 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FunctionSquare className="h-3.5 w-3.5 text-sky-400" />
                    <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">
                      Formula
                    </span>
                  </div>
                  <div className="text-center py-3 text-white text-lg overflow-x-auto">
                    <Katex latex={result.formula} block />
                  </div>
                  {result.formulaExplanation && (
                    <p className="text-xs text-white/60 leading-relaxed mt-2 pt-2 border-t border-white/10">
                      {result.formulaExplanation}
                    </p>
                  )}
                </motion.div>
              )}

              {/* ---------- VISUALIZATION ---------- */}
              {result.visual && result.visual.type && result.visual.type !== 'generic' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-xl bg-[#0a0f1e] border border-white/10 overflow-hidden"
                >
                  <div className="px-3 pt-3 pb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Play className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                        Visualization
                      </span>
                    </div>
                    {result.visual.interactive && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
                        Interactive
                      </span>
                    )}
                  </div>
                  <AutoVisualizer
                    vizType={result.visual.type}
                    params={result.visual.params || {}}
                  />
                </motion.div>
              )}

              {/* ---------- STEP-BY-STEP ---------- */}
              {result.steps && result.steps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="rounded-xl bg-[#0f172a] border border-white/10 overflow-hidden"
                >
                  <button
                    onClick={() => setShowSteps((v) => !v)}
                    className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-3.5 w-3.5 text-violet-400" />
                      <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">
                        Step-by-step Solution
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-violet-500/20 text-[9px] font-bold text-violet-300">
                        {result.steps.length}
                      </span>
                    </div>
                    {showSteps ? (
                      <ChevronDown className="h-3.5 w-3.5 text-white/40" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-white/40" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showSteps && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 space-y-2">
                          {result.steps.map((step, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + i * 0.08 }}
                              className="rounded-lg bg-white/5 border border-white/10 p-3 hover:border-violet-400/30 transition"
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                                  {step.step}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-white mb-1">
                                    {step.title}
                                  </p>
                                  {step.explanation && (
                                    <p className="text-[11px] text-white/70 leading-relaxed mb-1.5">
                                      {step.explanation}
                                    </p>
                                  )}
                                  {step.formula && (
                                    <div className="rounded-md bg-sky-500/10 border border-sky-400/20 px-2.5 py-1.5 my-1.5 text-white text-sm overflow-x-auto">
                                      <Katex latex={step.formula} />
                                    </div>
                                  )}
                                  {step.calculation && (
                                    <p className="text-[11px] font-mono text-amber-300/90">
                                      {step.calculation}
                                    </p>
                                  )}
                                  {step.result && (
                                    <div className="mt-1.5 flex items-center gap-1.5">
                                      <ArrowRight className="h-3 w-3 text-emerald-400" />
                                      <span className="text-xs font-bold text-emerald-300">
                                        {step.result}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ---------- KEY POINTS ---------- */}
              {result.keyPoints && result.keyPoints.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl bg-emerald-500/5 border border-emerald-400/20 p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                      Key Points
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {result.keyPoints.map((point, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + i * 0.05 }}
                        className="flex items-start gap-2 text-xs text-white/80 leading-relaxed"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{point}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* ---------- ANSWER ---------- */}
              {result.answer && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 }}
                  className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-400/40 p-4 text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                      Answer
                    </span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    <Katex latex={result.answer} block />
                  </p>
                </motion.div>
              )}

              {/* ---------- EXAMPLES ---------- */}
              {result.examples && result.examples.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-xl bg-[#0f172a] border border-white/10 p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                      Examples
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {result.examples.map((ex, i) => (
                      <div
                        key={i}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/80 hover:bg-white/10 transition cursor-pointer"
                        onClick={() => {
                          setInput(ex);
                          analyze(ex);
                        }}
                      >
                        <Katex latex={ex} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ---------- IMPORTANT NOTE ---------- */}
              {result.important && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="rounded-xl bg-rose-500/10 border border-rose-400/30 p-3 flex items-start gap-2"
                >
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-rose-300 uppercase tracking-wider mb-0.5">
                      Important
                    </p>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {result.important}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ---------- CONCLUSION ---------- */}
              {result.conclusion && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-400/30 p-3 flex items-start gap-2"
                >
                  <GraduationCap className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-violet-300 uppercase tracking-wider mb-0.5">
                      Conclusion
                    </p>
                    <p className="text-sm text-white/90 leading-relaxed">
                      {result.conclusion}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ---------- NEW QUESTION ---------- */}
              <button
                onClick={() => {
                  setResult(null);
                  setInput('');
                  setError('');
                }}
                className="w-full mt-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Ask another question
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!result && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4"
          >
            <motion.div
              className="h-16 w-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 flex items-center justify-center"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="h-8 w-8 text-fuchsia-400" />
            </motion.div>

            <div>
              <p className="text-base font-bold text-white/90">
                Ask me anything STEM
              </p>
              <p className="text-xs text-white/50 mt-1.5 max-w-xs leading-relaxed">
                Type a formula, equation, or scientific concept — I&apos;ll
                explain it step-by-step with a live visualization
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full max-w-xs mt-2">
              {[
                { icon: Calculator, label: 'Math', color: 'sky' },
                { icon: Atom, label: 'Physics', color: 'violet' },
                { icon: FlaskConical, label: 'Chemistry', color: 'amber' },
                { icon: Dna, label: 'Biology', color: 'emerald' },
              ].map((item) => {
                const Icon = item.icon;
                const colorMap: Record<string, string> = {
                  sky: 'from-sky-500/20 to-blue-500/20 border-sky-400/30 text-sky-300',
                  violet: 'from-violet-500/20 to-purple-500/20 border-violet-400/30 text-violet-300',
                  amber: 'from-amber-500/20 to-orange-500/20 border-amber-400/30 text-amber-300',
                  emerald: 'from-emerald-500/20 to-teal-500/20 border-emerald-400/30 text-emerald-300',
                };
                return (
                  <div
                    key={item.label}
                    className={`rounded-xl bg-gradient-to-br ${colorMap[item.color]} border p-2.5 flex items-center gap-2 justify-center`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[11px] font-bold">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-white/30 mt-3">
              Supports English, Urdu &amp; Roman Urdu
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}