import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import { ClassTranscript } from '@/models/ClassTranscript';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = process.env.JWT_SECRET;
    if (!secret) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

    let decoded: any;
    try { decoded = jwt.verify(token, secret); }
    catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

    if (!decoded?.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const body = await req.json();
    const { speakerRole, speakerName, text, isFinal } = body || {};

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text required' }, { status: 400 });
    }

    await connectDB();

    const user: any = await User.findById(decoded.userId).select('email').lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const teacher: any = await Teacher.findOne({ email: String(user.email).toLowerCase() })
      .select('_id').lean();

    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const doc: any = await ClassTranscript.findOne({
      _id: id,
      teacherId: teacher._id,
      endedAt: null,
    }).lean();

    if (!doc) return NextResponse.json({ error: 'Active session not found' }, { status: 404 });

    await ClassTranscript.updateOne(
      { _id: id },
      {
        $push: {
          messages: {
            speakerRole: speakerRole === 'student' ? 'student' : 'teacher',
            speakerName: String(speakerName || 'Unknown'),
            text: String(text).slice(0, 2000),
            isFinal: isFinal !== false,
            timestamp: new Date(),
            flagCategories: [],
          },
        },
      }
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[POST /api/livekit/transcript/[id]/message]', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}