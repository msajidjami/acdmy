import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/app/lib/auth/requireOwner';
import  connectDB  from '@/app/lib/dbConnect';
import { ClassTranscript } from '@/models/ClassTranscript';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireOwner(req);
  if (!auth.ok) return auth.response;

  await connectDB();
  const doc = await ClassTranscript.findOne({
    _id: params.id,
    ownerId: auth.session.userId, // ✅ دوسرے owner کا نہ کھلے
  }).lean();

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(doc);
}