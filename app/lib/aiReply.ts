import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set in environment variables');
    return null;
  }
  if (!client) {
    client = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return client;
}

/* ============================================================
   Dynamic model discovery
   ============================================================ */

let cachedModels: string[] | null = null;
let cacheTime = 0;
const CACHE_DURATION_MS = 1000 * 60 * 60;

const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-pro-latest',
  'gemini-2.5-pro',
];

async function getAvailableModels(): Promise<string[]> {
  if (cachedModels && Date.now() - cacheTime < CACHE_DURATION_MS) {
    return cachedModels;
  }

  if (!GEMINI_API_KEY) return FALLBACK_MODELS;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      console.warn('⚠️ Failed to fetch models list, using fallback');
      return FALLBACK_MODELS;
    }

    const data = await res.json();

    const models: string[] = (data.models || [])
      .filter((m: any) => {
        const name = String(m.name || '');
        const methods = m.supportedGenerationMethods || [];
        return (
          methods.includes('generateContent') &&
          !name.includes('embedding') &&
          !name.includes('aqa') &&
          !name.includes('vision')
        );
      })
      .map((m: any) => String(m.name).replace('models/', ''));

    const priority = (name: string): number => {
      if (name.includes('3.6') && name.includes('flash')) return 1;
      if (name.includes('3.5') && name.includes('flash')) return 2;
      if (name.includes('3.0') && name.includes('flash')) return 3;
      if (name.includes('flash-latest')) return 4;
      if (name.includes('2.5') && name.includes('flash')) return 5;
      if (name.includes('2.0') && name.includes('flash')) return 6;
      if (name.includes('flash')) return 7;
      if (name.includes('pro')) return 8;
      return 99;
    };

    const sorted = [...models].sort((a, b) => priority(a) - priority(b));

    if (sorted.length > 0) {
      cachedModels = sorted;
      cacheTime = Date.now();
      console.log(`✅ Loaded ${sorted.length} Gemini models:`, sorted.slice(0, 5));
      return sorted;
    }

    return FALLBACK_MODELS;
  } catch (error: any) {
    console.error('⚠️ Error fetching Gemini models:', error?.message);
    return FALLBACK_MODELS;
  }
}

/* ============================================================
   Local fallback
   ============================================================ */
function localFallback(message: string, academy: any): string {
  const msg = message.toLowerCase();
  const name = academy?.name || 'our academy';
  const isUrdu = /[\u0600-\u06FF]/.test(message);

  if (isUrdu) {
    if (msg.includes('فیس') || msg.includes('قیمت')) {
      return `السلام علیکم! 💰\n\n${name} میں دلچسپی کے لیے شکریہ۔ ہماری ٹیم آپ کو جلد فیس کی تفصیلات بھیجے گی، ان شاء اللہ۔`;
    }
    return `السلام علیکم ورحمۃ اللہ وبرکاتہ! 🤲\n\n${name} سے رابطہ کرنے کا شکریہ۔ ہماری ٹیم جلد آپ سے رابطہ کرے گی، ان شاء اللہ۔`;
  }

  if (msg.includes('fee') || msg.includes('price')) {
    return `Assalamu Alaikum! 💰\n\nThank you for your interest in ${name}. Our team will send the complete fee structure shortly, InshaAllah.`;
  }

  return `Assalamu Alaikum Wa Rahmatullahi Wa Barakatuh! 🤲\n\nThank you for contacting ${name}. Our team will reply shortly, InshaAllah.`;
}

/* ============================================================
   Gemini history builder
   ============================================================ */
function buildGeminiHistory(
  firstUserMessage: string,
  rawReplies: { senderType: string; text: string }[]
): { role: 'user' | 'model'; parts: { text: string }[] }[] {
  const history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

  const firstText = String(firstUserMessage || '').trim();
  if (!firstText) return [];

  history.push({ role: 'user', parts: [{ text: firstText }] });

  let expected: 'user' | 'model' = 'model';

  for (const r of rawReplies) {
    const text = String(r.text || '').trim();
    if (!text) continue;

    const role: 'user' | 'model' =
      r.senderType === 'user' ? 'user' : 'model';

    if (role !== expected) continue;

    history.push({ role, parts: [{ text }] });
    expected = role === 'user' ? 'model' : 'user';
  }

  if (history.length > 0 && history[history.length - 1].role === 'user') {
    history.pop();
  }

  return history.slice(-10);
}

/* ============================================================
   ✅ TYPES — focusedTeacher شامل
   ============================================================ */
export type AIReplyContext = {
  courses?: {
    title: string;
    description?: string;
    price?: number;
    level?: string;
  }[];
  teachers?: {
    name: string;
    subjects?: string[];
    bio?: string;
  }[];
  /* ✅ یہ نیا field ہے — teacher سے بات کے وقت */
  focusedTeacher?: {
    name: string;
    subjects?: string[];
    bio?: string;
  };
};

/* ============================================================
   AI Reply Generator
   ============================================================ */
export async function generateAIReply(
  userMessage: string,
  academy: any,
  conversationHistory: { senderType: string; text: string }[] = [],
  firstUserMessage: string = '',
  extraContext?: AIReplyContext
): Promise<string> {
  const genAI = getClient();

  if (!genAI) {
    console.error('❌ No Gemini client — using local fallback');
    return localFallback(userMessage, academy);
  }

  /* ---------- Courses list ---------- */
  const courseList = (extraContext?.courses || [])
    .slice(0, 20)
    .map(
      (c, i) =>
        `${i + 1}. "${c.title}" — ${
          c.price && c.price > 0 ? `$${c.price}` : 'Free'
        }${c.level ? `, level: ${c.level}` : ''}${
          c.description ? ` — ${c.description.slice(0, 100)}` : ''
        }`
    )
    .join('\n');

  /* ---------- Teachers list ---------- */
  const teacherList = (extraContext?.teachers || [])
    .slice(0, 20)
    .map(
      (t, i) =>
        `${i + 1}. "${t.name}"${
          t.subjects?.length ? ` — teaches: ${t.subjects.join(', ')}` : ''
        }`
    )
    .join('\n');

  const courseCount = (extraContext?.courses || []).length;
  const teacherCount = (extraContext?.teachers || []).length;

  /* ✅ Focused teacher block — جب teacher سے بات ہو */
  const focusedTeacher = extraContext?.focusedTeacher;

  const teacherFocusBlock = focusedTeacher
    ? `
═══════════════════════════════════════════
🎯 CURRENT CONVERSATION IS ABOUT THIS TEACHER: "${focusedTeacher.name}"
═══════════════════════════════════════════
- Name: ${focusedTeacher.name}
${
  focusedTeacher.subjects?.length
    ? `- Teaches: ${focusedTeacher.subjects.join(', ')}`
    : ''
}
${focusedTeacher.bio ? `- Bio: ${focusedTeacher.bio}` : ''}

IMPORTANT: The user is asking about THIS TEACHER specifically, not the whole academy.
- When they ask "courses" → mention courses this teacher might teach (from the academy course list)
- When they ask "fee" → if a course fee exists, mention it; otherwise say the academy will share details
- When they ask "timing" → say the academy team will reply with exact timing
- When they ask "enroll" → guide them to /academy/${academy?.slug || ''}
- When they ask for personal contact → politely refuse
- ALWAYS refer to this teacher's name in replies, not just "the academy"
`
    : '';

  const systemInstruction = `You are a friendly, professional AI assistant for the Islamic academy "${academy?.name || 'Islamic Academy'}" on the TaleemHub platform.

═══════════════════════════════════════════
🏫 ABOUT THIS WEBSITE (TaleemHub Platform)
═══════════════════════════════════════════
This is an online Islamic education platform where:

1. **Owners** create academies (like "${academy?.name || ''}") with courses and teachers
2. **Teachers** join academies and offer courses on Islamic & academic subjects
3. **Students / Users** can:
   - Browse all academies at /explore
   - Follow academies and teachers
   - Rate academies and teachers (1-5 stars with comment)
   - Enroll in courses after logging in
   - Send messages to academies via chat
   - Chat with the AI assistant (that's you!)
4. **Authentication**: Signup/Login via email/password or Google at /signup and /login

Key pages:
- /explore — discover all academies and teachers
- /academy/[slug] — academy detail page (courses, teachers, ratings)
- /login, /signup — authentication
- /dashboard — user dashboard (after login)

═══════════════════════════════════════════
📚 ACADEMY INFO — "${academy?.name || ''}"
═══════════════════════════════════════════
- Name: ${academy?.name || 'Islamic Academy'}
- Description: ${academy?.description || 'An educational academy'}
- Academy page: /academy/${academy?.slug || ''}
${academy?.address ? `- Address: ${academy.address}` : ''}

${
  courseCount > 0
    ? `📖 COURSES OFFERED (${courseCount} total):\n${courseList}`
    : '📖 No courses listed yet.'
}

${
  teacherCount > 0
    ? `👨‍🏫 TEACHERS (${teacherCount} total):\n${teacherList}`
    : '👨‍🏫 No teachers listed yet.'
}
${teacherFocusBlock}
═══════════════════════════════════════════
🌐 LANGUAGE RULE — MOST IMPORTANT
═══════════════════════════════════════════
Reply in the EXACT SAME language the user wrote in:
- Urdu (اردو script) → Urdu
- Roman Urdu ("kya fees hai") → Roman Urdu
- English → English
- Arabic → Arabic
Never switch languages.

═══════════════════════════════════════════
🚫 PRIVACY RULES — NEVER BREAK
═══════════════════════════════════════════
- NEVER share ANY teacher's personal contact info (email, phone, WhatsApp, social media)
- NEVER share ANY user's email/phone
- If asked, politely reply:
  - English: "For teacher inquiries, please send a message here and the academy team will assist you."
  - Urdu: "ٹیچر کے بارے میں معلومات کے لیے یہاں پیغام بھیجیں، اکیڈمی کی ٹیم آپ کی مدد کرے گی۔"
  - Roman Urdu: "Teacher ke baare mein maloomat ke liye yahan message bhejein, academy ki team aap ki madad karegi."
- NEVER invent prices, phone numbers, dates, or specific details

═══════════════════════════════════════════
✅ STYLE
═══════════════════════════════════════════
- First message: start with "Assalamu Alaikum" (or "السلام علیکم")
- Keep replies SHORT — 2 to 4 sentences
- Be warm, respectful, and helpful
- Suggest browsing /academy/${academy?.slug || ''} for full details
- If unsure, say the team will reply soon`;

  /* ✅ Dynamic models */
  const modelsToTry = await getAvailableModels();

  if (modelsToTry.length === 0) {
    console.error('❌ No models available — using fallback');
    return localFallback(userMessage, academy);
  }

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`🔄 Trying Gemini model: ${modelName}`);

      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
      });

      const history = buildGeminiHistory(firstUserMessage, conversationHistory);
      const chat = model.startChat({ history });

      const result = await chat.sendMessage(userMessage);
      const text = result.response.text().trim();

      if (text) {
        console.log(`✅ Gemini success with model: ${modelName}`);
        return text;
      }
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      console.error(`❌ Model "${modelName}" failed:`, errMsg);
      lastError = error;

      if (errMsg.includes('404') || errMsg.includes('not found')) continue;

      if (
        errMsg.includes('API_KEY_INVALID') ||
        errMsg.includes('API key not valid') ||
        errMsg.includes('PERMISSION_DENIED')
      ) {
        console.error('🛑 API key invalid — stopping');
        break;
      }

      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        console.error('🛑 Quota exhausted — stopping');
        break;
      }

      if (errMsg.includes('400')) continue;
    }
  }

  cachedModels = null;
  cacheTime = 0;

  console.error('❌ All Gemini models failed. Last error:', lastError?.message);
  return localFallback(userMessage, academy);
}