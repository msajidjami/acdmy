import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/app/lib/auth/requireOwner';
import connectDB from '@/app/lib/dbConnect';
import { ClassTranscript } from '@/models/ClassTranscript';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireOwner(req);
    if (!auth.ok) return auth.response;

    await connectDB();
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim() || '';
    const onlyFlagged = url.searchParams.get('flagged') === '1';
    const limit = Math.min(
      Number(url.searchParams.get('limit')) || 50,
      200
    );

    /* ✅ صرف اسی owner کے ٹرانسکرپٹ */
    const filter: any = { ownerId: auth.session.userId };

    if (q) {
      filter.$or = [
        { teacherName: { $regex: q, $options: 'i' } },
        { teacherEmail: { $regex: q, $options: 'i' } },
        { studentName: { $regex: q, $options: 'i' } },
        { courseName: { $regex: q, $options: 'i' } },
        { roomName: { $regex: q, $options: 'i' } },
      ];
    }
    if (onlyFlagged) filter['flags.0'] = { $exists: true };

    const items = await ClassTranscript.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(
        'assignmentId roomName courseName teacherName teacherEmail studentName startedAt endedAt durationSec flags'
      )
      .lean();

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error('[GET /api/owner/transcripts]', err);
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}