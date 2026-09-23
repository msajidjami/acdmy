import { NextRequest, NextResponse } from 'next/server';
import connectDB  from '@/app/lib/dbConnect';
import { ClassTranscript } from '@/models/ClassTranscript';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { speakerRole, speakerName, text, flags = [] } = await req.json();
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });

    const message = {
      speakerRole,
      speakerName,
      text,
      isFinal: true,
      timestamp: new Date(),
      flagCategories: Array.isArray(flags) ? flags.map((f: any) => f.category) : [],
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
    if (flagDocs.length) update.$push.flags = { $each: flagDocs };

    await ClassTranscript.updateOne({ _id: params.id }, update);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    await ClassTranscript.updateOne(
      { _id: params.id, endedAt: null },
      {
        $set: {
          endedAt: new Date(),
          durationSec: Number(body.durationSec) || 0,
        },
      }
    );
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}