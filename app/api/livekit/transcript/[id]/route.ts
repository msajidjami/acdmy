import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import { ClassTranscript } from '@/models/ClassTranscript';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ✅ Next.js 15 — params اب Promise ہیں */

/* ============================================================
   PATCH — نیا message شامل کریں (اور flags اگر ہوں)
   ============================================================ */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const { speakerRole, speakerName, text, flags = [] } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: 'text required' },
        { status: 400 }
      );
    }

    const message = {
      speakerRole,
      speakerName,
      text,
      isFinal: true,
      timestamp: new Date(),
      flagCategories: Array.isArray(flags)
        ? flags.map((f: any) => f.category)
        : [],
    };

    const flagDocs = Array.isArray(flags)
      ? flags.map((f: any) => ({
          severity: f.severity || 'medium',
          category: f.category || 'suspicious_contact',
          reason: f.reason || '',
          matchedText: f.matchedText || '',
          speakerRole,
          timestamp: new Date(),
        }))
      : [];

    const update: any = { $push: { messages: message } };
    if (flagDocs.length) {
      update.$push.flags = { $each: flagDocs };
    }

    await ClassTranscript.updateOne({ _id: id }, update);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed' },
      { status: 500 }
    );
  }
}

/* ============================================================
   PUT — سیشن ختم کریں (endedAt سیٹ کریں)
   ============================================================ */

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const body = await req.json().catch(() => ({}));

    await ClassTranscript.updateOne(
      { _id: id, endedAt: null },
      {
        $set: {
          endedAt: new Date(),
          durationSec: Number(body.durationSec) || 0,
        },
      }
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed' },
      { status: 500 }
    );
  }
}