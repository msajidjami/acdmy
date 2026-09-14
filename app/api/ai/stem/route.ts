import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/* ============================================================
   ✅ Safe fallback models
   ============================================================ */
const SAFE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.0-flash',
  'gemini-flash-latest',
];

/* ============================================================
   Filter: TTS، preview، embedding، vision سب خارج
   ============================================================ */
function isUsableModel(name: string): boolean {
  const n = name.toLowerCase();

  /* ❌ خارج کریں */
  if (n.includes('tts')) return false;
  if (n.includes('embedding')) return false;
  if (n.includes('aqa')) return false;
  if (n.includes('vision')) return false;
  if (n.includes('image')) return false;
  if (n.includes('audio')) return false;
  if (n.includes('live')) return false;
  if (n.includes('preview')) return false;
  if (n.includes('exp')) return false;
  if (n.includes('thinking')) return false;
  if (n.includes('learnlm')) return false;
  if (n.includes('gemma')) return false;

  /* ✅ صرف flash یا pro allow */
  if (n.includes('flash')) return true;
  if (n.endsWith('-pro') && !n.includes('preview')) return true;

  return false;
}

/* ============================================================
   Priority: flash-lite > flash > pro
   ============================================================ */
function modelPriority(name: string): number {
  const n = name.toLowerCase();
  if (n.includes('3.6') && n.includes('flash') && n.includes('lite')) return 1;
  if (n.includes('3.6') && n.includes('flash')) return 2;
  if (n.includes('3.5') && n.includes('flash') && n.includes('lite')) return 3;
  if (n.includes('3.5') && n.includes('flash')) return 4;
  if (n.includes('3.0') && n.includes('flash')) return 5;
  if (n.includes('flash-latest')) return 6;
  if (n.includes('flash')) return 7;
  if (n.endsWith('-pro')) return 8;
  return 99;
}

/* ============================================================
   Dynamic model discovery
   ============================================================ */
let cachedModels: string[] | null = null;
let cacheTime = 0;
const CACHE_DURATION_MS = 1000 * 60 * 30; // 30 منٹ

async function getAvailableModels(): Promise<string[]> {
  if (cachedModels && Date.now() - cacheTime < CACHE_DURATION_MS) {
    return cachedModels;
  }

  if (!GEMINI_API_KEY) return SAFE_MODELS;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`,
      { cache: 'no-store' }
    );

    if (!res.ok) return SAFE_MODELS;

    const data = await res.json();

    const models: string[] = (data.models || [])
      .filter((m: any) => {
        const name = String(m.name || '').replace('models/', '');
        const methods = m.supportedGenerationMethods || [];
        return methods.includes('generateContent') && isUsableModel(name);
      })
      .map((m: any) => String(m.name).replace('models/', ''));

    const sorted = [...models].sort(
      (a, b) => modelPriority(a) - modelPriority(b)
    );

    if (sorted.length > 0) {
      cachedModels = sorted;
      cacheTime = Date.now();
      console.log(`✅ Loaded ${sorted.length} usable models:`, sorted.slice(0, 5));
      return sorted;
    }

    return SAFE_MODELS;
  } catch {
    return SAFE_MODELS;
  }
}

/* ============================================================
   POST — AI STEM Analysis
   ============================================================ */
export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY missing' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({} as any));
    const input = String(body.input || '').trim().slice(0, 500);
    const subject = String(body.subject || '').trim();

    if (!input) {
      return NextResponse.json(
        { error: 'Input required' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const prompt = `
You are an advanced interactive STEM teaching AI for an online education platform.

Your job is NOT merely to answer the user's question.

Your job is to ANALYZE the user's input and convert it into a beautiful, interactive, visual learning experience that can be rendered by a web frontend.

The input may be in:
- English
- Urdu
- Roman Urdu
- Arabic
- mixed languages

Subjects may include:
- Mathematics
- Physics
- Chemistry
- Biology
- Computer Science
- Coding
- General Science
- Engineering
- Astronomy
- Statistics
- Logic

IMPORTANT:
Understand what the student is asking first.
Then decide the best way to visually teach it.

USER INPUT:
"${input}"

SUBJECT HINT:
"${subject || 'auto-detect'}"

==================================================
CORE REQUIREMENT
==================================================

Return ONLY valid JSON.

DO NOT return markdown.
DO NOT return code fences.
DO NOT return explanations outside JSON.
DO NOT use comments inside JSON.

The JSON must be directly parseable with JSON.parse().

==================================================
LANGUAGE RULE
==================================================

Detect the language of the user's input.

The following fields MUST use the same language as the user whenever possible:

- title
- explanation
- summary
- steps
- keyPoints
- formulaExplanation
- labels
- conclusion

If the user writes Urdu, respond in Urdu.
If the user writes Roman Urdu, respond in Roman Urdu.
If the user writes English, respond in English.

Mathematical notation, scientific formulas, chemical formulas and programming code must remain in their standard notation.

==================================================
OUTPUT STRUCTURE
==================================================

Return exactly this general structure:

{
  "title": "",
  "subject": "",
  "topic": "",
  "difficulty": "beginner|intermediate|advanced",
  "explanation": "",
  "summary": "",
  "keyPoints": [],
  "steps": [
    {
      "step": 1,
      "title": "",
      "explanation": "",
      "formula": "",
      "calculation": "",
      "result": ""
    }
  ],
  "formula": "",
  "formulaExplanation": "",
  "answer": "",
  "visual": {
    "type": "",
    "title": "",
    "description": "",
    "animation": true,
    "interactive": true,
    "labels": [],
    "params": {}
  },
  "examples": [],
  "important": "",
  "conclusion": ""
}

==================================================
VISUAL TYPES
==================================================

Allowed visual.type values:

"addition" "subtraction" "multiplication" "division"
"number_line" "fraction" "percentage" "algebra" "equation" "quadratic"
"graph" "coordinate_plane" "geometry" "triangle" "pythagoras" "circle"
"area" "volume" "angle" "trigonometry" "statistics" "probability"
"calculus" "derivative" "integral"

"force" "motion" "velocity" "acceleration" "newton_laws" "gravity"
"projectile" "energy" "work" "power" "momentum" "electricity" "circuit"
"magnetism" "wave" "sound" "light" "optics" "pendulum" "einstein" "atom"

"molecule" "water_molecule" "chemical_formula" "chemical_reaction"
"balancing_equation" "periodic_table" "acid_base"

"cell" "dna" "rna" "heart" "brain" "lungs" "digestive_system"
"photosynthesis" "respiration" "ecosystem" "food_chain" "human_body"
"plant" "generic"

For computer science / coding:
"code" "algorithm" "flowchart" "binary" "data_structure" "network"
"database" "html" "css" "javascript" "python" "programming"

==================================================
MATHEMATICS RULES
==================================================

For "5 + 3" or "add 5 and 3" → visual.type = "addition"
params: { "a": 5, "b": 3, "result": 8 }

For subtraction: { "a": 5, "b": 3, "result": 2 }
For multiplication: { "a": 5, "b": 3, "result": 15 }
For division: { "a": 15, "b": 3, "result": 5 }

For equations → visual.type = "equation"
params: { "equation": "2x + 5 = 15", "variable": "x", "steps": ["2x = 10","x = 5"], "answer": "x = 5" }

For graphs → visual.type = "graph"
params: { "function": "x^2", "xMin": -10, "xMax": 10, "yMin": -5, "yMax": 100, "points": [] }

For Pythagoras → visual.type = "pythagoras"
params: { "a": 3, "b": 4, "c": 5, "formula": "a² + b² = c²" }

For circle → visual.type = "circle"
params: { "radius": 5, "diameter": 10, "area": "25π", "circumference": "10π" }

For triangle → visual.type = "triangle"
params: { "a": 3, "b": 4, "c": 5 }

==================================================
PHYSICS RULES
==================================================

For F=ma / force / mass / acceleration → visual.type = "force"
params: { "mass": 5, "acceleration": 2, "force": 10, "unit": "N", "formula": "F = ma" }

For motion → visual.type = "motion"
params: { "velocity": 10, "time": 5, "distance": 50, "unit": "m" }

For gravity → visual.type = "gravity"
params: { "mass": 10, "gravity": 9.8, "force": 98 }

For E=mc² → visual.type = "einstein"
params: { "mass": 1, "c": 299792458, "energy": "8.98755179 × 10^16 J" }

For waves → visual.type = "wave"
params: { "amplitude": 1, "frequency": 2, "wavelength": 1, "speed": 2 }

For pendulum → visual.type = "pendulum"
params: { "length": 1, "angle": 30, "gravity": 9.8 }

==================================================
CHEMISTRY RULES
==================================================

Recognize: H2O CO2 O2 H2 NaCl H2SO4 HCl NaOH CH4 NH3

For a molecule → visual.type = "molecule"
params: { "formula": "H2O", "atoms": [{"element":"O","count":1},{"element":"H","count":2}], "shape": "bent" }

For chemical reactions → visual.type = "chemical_reaction"
params: { "reactants": ["2H2","O2"], "products": ["2H2O"], "balanced": true }

For balancing → visual.type = "balancing_equation"
params: { "original": "H2 + O2 → H2O", "balanced": "2H2 + O2 → 2H2O", "steps": [] }

==================================================
BIOLOGY RULES
==================================================

For cell → visual.type = "cell"
params: { "cellType": "plant|animal", "parts": [{"name":"Nucleus","description":""}] }

For DNA → visual.type = "dna"
params: { "bases": ["A","T","C","G"], "pairs": [["A","T"],["C","G"]] }

For heart → visual.type = "heart"
params: { "chambers": ["Right Atrium","Right Ventricle","Left Atrium","Left Ventricle"], "bloodFlow": ["Body","Right Atrium","Right Ventricle","Lungs","Left Atrium","Left Ventricle","Body"] }

For photosynthesis → visual.type = "photosynthesis"
params: { "formula": "6CO2 + 6H2O → C6H12O6 + 6O2", "inputs": ["CO2","H2O","Sunlight"], "outputs": ["Glucose","O2"] }

==================================================
COMPUTER SCIENCE RULES
==================================================

For algorithm → visual.type = "algorithm"
params: { "language": "javascript", "steps": ["Input","Process","Output"] }

For flowchart → visual.type = "flowchart"
params: { "nodes": [{"id":"1","type":"start","text":"Start"}], "connections": [] }

For code → visual.type = "code"
params: { "language": "javascript", "code": "", "output": "" }

==================================================
STEP-BY-STEP TEACHING
==================================================

If the problem requires calculation, ALWAYS show step-by-step solution.

Example for "F=ma, mass 5kg, acceleration 2m/s²":

steps:
[
  {"step":1,"title":"فارمولا","explanation":"Force کا فارمولا F = ma ہے۔","formula":"F = ma","calculation":"","result":""},
  {"step":2,"title":"اعداد رکھیں","explanation":"m = 5kg اور a = 2m/s²","formula":"F = 5 × 2","calculation":"5 × 2","result":"10 N"}
]

==================================================
DIFFICULTY
==================================================
Determine: beginner | intermediate | advanced

==================================================
EXPLANATION STYLE
==================================================
Teach like an excellent classroom teacher. Be clear, concise, educational, logically ordered, visually descriptive, easy to understand.

==================================================
VISUAL PARAMETER RULE
==================================================
Put actual numbers, formulas, labels, points, atoms, variables, equations inside params — not just in "description".

==================================================
WHEN INPUT IS AMBIGUOUS
==================================================
For "force", "cell", "quadratic", "DNA" — infer the most useful educational visualization.

==================================================
WHEN INPUT IS NOT STEM
==================================================
visual.type = "generic" but still explain helpfully.

==================================================
QUALITY RULES
==================================================
1. Never invent numerical answers — calculate accurately.
2. Show step-by-step for calculations.
3. Preserve units, scientific notation, chemical formulas.
4. Use Unicode superscripts: ² ³ ⁻¹
5. Do not confuse mass with weight.
6. Do not confuse velocity with acceleration.
7. For chemistry, ensure equations are chemically sensible.
8. For biology, use scientifically accepted terminology.
9. For graphs, provide sensible x/y ranges.
10. For geometry, provide all known dimensions.
11. If question has multiple parts, solve them in order.
12. If question contains an equation, preserve the original equation.

==================================================
FINAL JSON EXAMPLE (for "5 + 3")
==================================================
{
  "title": "5 + 3",
  "subject": "Mathematics",
  "topic": "arithmetic",
  "difficulty": "beginner",
  "explanation": "5 میں 3 جمع کرنے سے ہمیں 8 حاصل ہوتا ہے۔",
  "summary": "5 + 3 = 8",
  "keyPoints": ["پہلی تعداد 5 ہے","دوسری تعداد 3 ہے","دونوں کو جمع کرنے پر 8 حاصل ہوتا ہے"],
  "steps": [
    {"step":1,"title":"اعداد دیکھیں","explanation":"ہمارے پاس 5 اور 3 ہیں۔","formula":"5 + 3","calculation":"","result":""},
    {"step":2,"title":"جمع کریں","explanation":"5 میں 3 جمع کریں۔","formula":"5 + 3 = 8","calculation":"5 + 3","result":"8"}
  ],
  "formula": "a + b",
  "formulaExplanation": "جمع میں دو یا زیادہ اعداد کو آپس میں ملایا جاتا ہے۔",
  "answer": "8",
  "visual": {
    "type": "addition",
    "title": "Addition",
    "description": "5 اور 3 کو visual blocks یا number line کے ذریعے دکھائیں۔",
    "animation": true,
    "interactive": true,
    "labels": ["5", "3", "8"],
    "params": { "a": 5, "b": 3, "result": 8 }
  },
  "examples": ["4 + 2 = 6","7 + 3 = 10"],
  "important": "",
  "conclusion": "لہٰذا 5 + 3 = 8"
}

IMPORTANT:
Return ONLY the JSON object.
`;

    let lastError: any = null;
    let quotaExceeded = false;

    const modelsToTry = await getAvailableModels();

    if (modelsToTry.length === 0) {
      throw new Error('No usable Gemini models found');
    }

    for (const modelName of modelsToTry) {
      try {
        console.log(`🔄 Trying Gemini model: ${modelName}`);

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON in response');

        const data = JSON.parse(jsonMatch[0]);

        console.log(`✅ Success with model: ${modelName}`);

        return NextResponse.json(data, {
          headers: { 'Cache-Control': 'no-store' },
        });
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        console.error(`❌ Model ${modelName} failed:`, msg.slice(0, 150));

        /* 404 — model موجود نہیں */
        if (msg.includes('404')) continue;

        /* 400 — modality/format issue */
        if (msg.includes('400')) continue;

        /* 503 — server busy */
        if (msg.includes('503')) continue;

        /* 429 — quota → اگلا try، اگر سب fail ہوں تو quota message */
        if (msg.includes('429') || msg.includes('quota')) {
          quotaExceeded = true;
          continue;
        }

        /* باقی — اگلا try */
        continue;
      }
    }

    throw new Error(
      quotaExceeded ? 'QUOTA_EXCEEDED' : lastError?.message || 'All models failed'
    );
  } catch (err: any) {
    console.error('❌ AI STEM error:', err?.message);

    const isQuota = err?.message === 'QUOTA_EXCEEDED';

    return NextResponse.json(
      {
        error: err?.message || 'AI failed',
        title: isQuota ? 'Quota Exceeded' : 'AI Error',
        subject: 'Unknown',
        topic: 'error',
        difficulty: 'beginner',
        explanation: isQuota
          ? 'AI کا روزانہ quota ختم ہو گیا ہے۔ براہ کرم کچھ دیر بعد دوبارہ کوشش کریں۔'
          : 'معذرت، AI اس وقت جواب نہیں دے سکا۔ براہ کرم دوبارہ کوشش کریں۔',
        summary: '',
        keyPoints: [],
        steps: [],
        formula: '',
        formulaExplanation: '',
        answer: '',
        visual: {
          type: 'generic',
          title: 'Error',
          description: '',
          animation: false,
          interactive: false,
          labels: [],
          params: {},
        },
        examples: [],
        important: '',
        conclusion: '',
      },
      { status: 200 }
    );
  }
}