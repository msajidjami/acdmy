/* ============================================================
   AI CONTENT DETECTOR
   Heuristic-based — free, fast, no external API needed
   ============================================================ */

export type AiDetectionResult = {
  score: number;           // 0-100 (higher = more AI-like)
  status: 'passed' | 'warning' | 'rejected';
  reasons: string[];
  signals: {
    burstiness: number;       // sentence length variation (low = AI)
    vocabularyRichness: number; // unique/total words
    aiPhrases: number;         // count of common AI phrases
    perfectStructure: number;  // overly perfect formatting
  };
};

/* ---------- Common AI transition phrases ---------- */
const AI_PHRASES = [
  // English
  'furthermore', 'moreover', 'additionally', 'in conclusion',
  'it is important to note', 'it is worth noting', 'in summary',
  'however, it', 'nevertheless', 'consequently', 'as a result',
  'firstly', 'secondly', 'thirdly', 'lastly',
  'in today\'s world', 'in the realm of', 'delve into',
  'navigating the', 'in essence', 'by leveraging',
  'plays a crucial role', 'plays a vital role', 'plays a significant role',
  'it is essential to', 'it should be noted',
  // Urdu
  'اس کے علاوہ', 'مزید برآں', 'لہٰذا', 'نتیجتاً', 'اسی طرح',
  'یہ بات قابل غور ہے', 'قابل ذکر ہے',
  // Arabic
  'علاوة على ذلك', 'بالإضافة إلى ذلك', 'في الختام',
];

/* ---------- Text helpers ---------- */
function splitSentences(text: string): string[] {
  return text
    .replace(/<[^>]*>/g, ' ')
    .split(/[.!?۔؟\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/* ---------- Signal 1: Burstiness (sentence length variance) ---------- */
function calcBurstiness(sentences: string[]): number {
  if (sentences.length < 3) return 0.5;

  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation
  const cv = mean > 0 ? stdDev / mean : 0;

  // Human writing: CV > 0.6 typically
  // AI writing: CV < 0.4 typically
  // Normalize to 0-1 where 1 = human-like
  const humanLike = Math.min(1, cv / 0.8);
  return humanLike;
}

/* ---------- Signal 2: Vocabulary richness ---------- */
function calcVocabRichness(tokens: string[]): number {
  if (tokens.length < 20) return 1;
  const unique = new Set(tokens).size;
  const ratio = unique / tokens.length;

  // Human: 0.5-0.7, AI: 0.35-0.5
  // Normalize where 1 = very rich
  return Math.min(1, ratio / 0.65);
}

/* ---------- Signal 3: AI phrases count ---------- */
function countAiPhrases(text: string): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const phrase of AI_PHRASES) {
    const regex = new RegExp(phrase, 'gi');
    const matches = lower.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

/* ---------- Signal 4: Perfect structure detection ---------- */
function calcPerfectStructure(text: string): number {
  const plain = text.replace(/<[^>]*>/g, ' ');

  // Check: sentences all start with capital letter & end with period
  const sentences = plain.split(/[.!?۔؟]+/).filter((s) => s.trim().length > 5);
  if (sentences.length < 5) return 0;

  let wellFormed = 0;
  for (const s of sentences) {
    const trimmed = s.trim();
    if (/^[A-Z\u0600-\u06FF\u0750-\u077F]/.test(trimmed) && trimmed.length > 15) {
      wellFormed++;
    }
  }

  return wellFormed / sentences.length;
}

/* ---------- Main detection ---------- */
export function detectAiContent(
  content: string,
  language: 'en' | 'ur' | 'ar' = 'en'
): AiDetectionResult {
  const reasons: string[] = [];

  // Clean HTML
  const plain = content.replace(/<[^>]*>/g, ' ').trim();

  if (plain.length < 200) {
    return {
      score: 0,
      status: 'passed',
      reasons: ['Too short to analyze'],
      signals: { burstiness: 1, vocabularyRichness: 1, aiPhrases: 0, perfectStructure: 0 },
    };
  }

  const sentences = splitSentences(plain);
  const tokens = tokenize(plain);

  const burstiness = calcBurstiness(sentences);
  const vocabRichness = calcVocabRichness(tokens);
  const aiPhraseCount = countAiPhrases(plain);
  const perfectStructure = calcPerfectStructure(plain);

  /* ---------- Scoring ---------- */
  let aiScore = 0;

  // 1. Burstiness (weight: 35)
  if (burstiness < 0.4) {
    aiScore += 35 * (1 - burstiness / 0.4);
    reasons.push('Sentence lengths are unusually uniform');
  } else if (burstiness < 0.55) {
    aiScore += 15 * (1 - burstiness / 0.55);
    reasons.push('Low variation in sentence structure');
  }

  // 2. Vocabulary richness (weight: 25)
  if (vocabRichness < 0.6) {
    aiScore += 25 * (1 - vocabRichness / 0.6);
    reasons.push('Limited vocabulary diversity');
  }

  // 3. AI phrases (weight: 25)
  const phraseRate = aiPhraseCount / Math.max(1, tokens.length / 100);
  if (phraseRate > 1) {
    const add = Math.min(25, phraseRate * 4);
    aiScore += add;
    reasons.push(`${aiPhraseCount} common AI transition phrases detected`);
  }

  // 4. Perfect structure (weight: 15)
  if (perfectStructure > 0.85) {
    aiScore += 15 * ((perfectStructure - 0.85) / 0.15);
    reasons.push('Overly perfect grammatical structure');
  }

  aiScore = Math.min(100, Math.round(aiScore));

  /* ---------- Status ---------- */
  let status: AiDetectionResult['status'] = 'passed';
  if (aiScore >= 70) status = 'rejected';
  else if (aiScore >= 40) status = 'warning';

  if (reasons.length === 0) {
    reasons.push('Content appears human-written');
  }

  return {
    score: aiScore,
    status,
    reasons,
    signals: {
      burstiness: Math.round(burstiness * 100) / 100,
      vocabularyRichness: Math.round(vocabRichness * 100) / 100,
      aiPhrases: aiPhraseCount,
      perfectStructure: Math.round(perfectStructure * 100) / 100,
    },
  };
}