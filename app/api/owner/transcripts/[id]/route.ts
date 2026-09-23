import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/app/lib/auth/requireOwner';
import connectDB from '@/app/lib/dbConnect';
import { ClassTranscript } from '@/models/ClassTranscript';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ✅ Next.js 15 — params اب Promise ہیں */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireOwner(req);
    if (!auth.ok) return auth.response;

    await connectDB();
    const { id } = await params;

    const doc = await ClassTranscript.findOne({
      _id: id,
      ownerId: auth.session.userId, // ✅ دوسرے owner کا نہ کھلے
    }).lean();

    if (!doc) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(doc);
  } catch (err: any) {
    console.error('[GET /api/owner/transcripts/[id]]', err);
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}