import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    const data = await res.json();

    const models = (data.models || [])
      .filter((m: any) =>
        m.supportedGenerationMethods?.includes('generateContent')
      )
      .map((m: any) => m.name.replace('models/', ''));

    return NextResponse.json({
      totalAvailable: models.length,
      models,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}