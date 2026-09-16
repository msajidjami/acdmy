// app/api/owner/enrollments/[id]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/dbConnect';
import Enrollment from '@/models/Enrollment';
import EnrollmentMessage from '@/models/EnrollmentMessage';
import Academy from '@/models/Academy';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;
type JwtPayload = { userId?: string };

async function getUser(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const d = jwt.verify(token, JWT_SECRET as string) as JwtPayload;
    if (!d?.userId) return null;
    await connectDB();
    return await User.findById(d.userId).select('name email').lean();
  } catch {
    return null;
  }
}

/* GET — all messages */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const academy = await Academy.findOne({ ownerId: (user as any)._id }).lean();
    if (!academy) {
      return NextResponse.json({ error: 'No academy found' }, { status: 404 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const enrollment = await Enrollment.findOne({
      _id: id,
      academyId: (academy as any)._id,
    })
      .select('_id')
      .lean();

    if (!enrollment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await EnrollmentMessage.updateMany(
      { enrollmentId: enrollment._id, senderRole: 'user', readByOwner: false },
      { $set: { readByOwner: true } }
    );

    const messages = await EnrollmentMessage.find({
      enrollmentId: enrollment._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      messages: messages.map((m: any) => ({
        _id: String(m._id),
        senderRole: m.senderRole,
        senderName: m.senderName || '',
        content: m.content,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error('GET owner messages error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/* POST — send message */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const academy = await Academy.findOne({ ownerId: (user as any)._id }).lean();
    if (!academy) {
      return NextResponse.json({ error: 'No academy found' }, { status: 404 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const enrollment = await Enrollment.findOne({
      _id: id,
      academyId: (academy as any)._id,
    })
      .select('_id')
      .lean();

    if (!enrollment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const content = String(body?.content || '').trim();

    if (!content) {
      return NextResponse.json({ error: 'Message is empty' }, { status: 400 });
    }

    const msg = await EnrollmentMessage.create({
      enrollmentId: enrollment._id,
      academyId: (academy as any)._id,
      senderId: (user as any)._id,
      senderRole: 'owner',
      senderName: String((user as any).name || 'Owner'),
      content: content.slice(0, 2000),
      readByOwner: true,
      readByUser: false,
    });

    return NextResponse.json({
      success: true,
      message: {
        _id: String(msg._id),
        senderRole: msg.senderRole,
        senderName: msg.senderName,
        content: msg.content,
        createdAt: msg.createdAt,
      },
    });
  } catch (error) {
    console.error('POST owner message error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}