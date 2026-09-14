import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
];

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY missing' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({} as any));
    const text = String(body.text || '').trim().slice(0, 800);
    const mode = String(body.mode || 'arabic'); // 'arabic' | 'urdu'

    if (!text) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const prompt =
      mode === 'urdu'
        ? `You are an expert in Urdu language and Islamic texts.

Analyze this Urdu text:
"${text}"

Return ONLY valid JSON (no markdown):
{
  "enhancedText": "same text, properly punctuated Urdu",
  "type": "quran|hadith|poetry|general",
  "arabicOriginal": "if this is a translation of Quran/Hadith, provide the original Arabic with FULL harakat",
  "reference": "Surah name + verse number (e.g. Surah Al-Fatihah 1:2) or Hadith book + number, or empty",
  "translation": "English translation (if Quran/Hadith)",
  "explanation": "1-2 sentences in Urdu about this text"
}`
        : `You are an expert in Arabic language, Quran and Hadith.

Analyze this Arabic text:
"${text}"

Your tasks:
1. Add FULL harakat (diacritics) to every letter if missing.
2. Identify if it is a Quran verse, Hadith, poetry, or general Arabic.
3. If Quran: give exact Surah name + verse number (e.g. Surah Al-Fatihah 1:2).
4. If Hadith: give book name + narration number + narrator if known.
5. Provide English translation.

Return ONLY valid JSON (no markdown):
{
  "enhancedText": "the text with FULL harakat on every letter",
  "type": "quran|hadith|poetry|general",
  "reference": "exact reference like 'Surah Al-Baqarah 2:255' or 'Sahih Bukhari 1:1'",
  "translation": "English translation",
  "explanation": "short explanation in the SAME language as input or in Arabic"
}`;

    let lastError: any = null;

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const raw = result.response.text().trim();

        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON in response');

        const data = JSON.parse(jsonMatch[0]);

        return NextResponse.json(data, {
          headers: { 'Cache-Control': 'no-store' },
        });
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        if (msg.includes('404') || msg.includes('400') || msg.includes('503')) {
          continue;
        }
        if (msg.includes('429') || msg.includes('quota')) continue;
        continue;
      }
    }

    throw lastError || new Error('All models failed');
  } catch (err: any) {
    console.error('❌ Arabic AI error:', err?.message);
    return NextResponse.json(
      {
        error: err?.message || 'AI failed',
        enhancedText: '',
        type: 'general',
        reference: '',
        translation: '',
        explanation: '',
      },
      { status: 200 }
    );
  }
}