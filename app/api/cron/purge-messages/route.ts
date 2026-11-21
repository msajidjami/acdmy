// app/api/cron/purge-messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import connectDB from '@/app/lib/dbConnect';
import ChatMessage from '@/models/ChatMessage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RETENTION_DAYS = 30;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '');
  const qs = req.nextUrl.searchParams.get('secret');
  if ((auth || qs) !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const old = await ChatMessage.find({ createdAt: { $lt: cutoff } })
    .select('_id audioUrl')
    .lean();

  let filesDeleted = 0;
  for (const m of old) {
    if (m.audioUrl && m.audioUrl.startsWith('/uploads/')) {
      const p = path.join(process.cwd(), 'public', m.audioUrl);
      try {
        await unlink(p);
        filesDeleted++;
      } catch {
        /* ignore */
      }
    }
  }

  const result = await ChatMessage.deleteMany({
    _id: { $in: old.map((m) => m._id) },
  });

  return NextResponse.json({
    success: true,
    deletedMessages: result.deletedCount,
    deletedFiles: filesDeleted,
    retentionDays: RETENTION_DAYS,
    ranAt: new Date().toISOString(),
  });
}