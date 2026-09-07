import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Inquiry from '@/models/Inquiry';
import Academy from '@/models/Academy';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET!;

async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    return user;
  } catch {
    return null;
  }
}

// GET single inquiry (already exists, keep as is)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const academy = await Academy.findOne({ ownerId: user._id });
    if (!academy) {
      return NextResponse.json({ error: 'No academy found' }, { status: 404 });
    }
    const { id } = await params;
    const inquiry = await Inquiry.findOne({ _id: id, academyId: academy._id });
    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }
    return NextResponse.json(inquiry);
  } catch (error) {
    console.error('GET /api/owner/inquiries/[id] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ✅ PUT: Update inquiry (reply, status, notes)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const academy = await Academy.findOne({ ownerId: user._id });
    if (!academy) {
      return NextResponse.json({ error: 'No academy found' }, { status: 404 });
    }
    const { id } = await params;
    const inquiry = await Inquiry.findOne({ _id: id, academyId: academy._id });
    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    const body = await req.json();
    const { reply, status, notes } = body;

    if (reply) {
      inquiry.notes = inquiry.notes
        ? `${inquiry.notes}\n\n✅ Reply from Owner: ${reply}`
        : `✅ Reply from Owner: ${reply}`;
      inquiry.status = 'replied';
      inquiry.repliedAt = new Date();
      inquiry.repliedBy = user._id;
    }
    if (status) {
      inquiry.status = status;
    }
    if (notes !== undefined) {
      inquiry.notes = notes;
    }

    await inquiry.save();
    return NextResponse.json(inquiry);
  } catch (error) {
    console.error('PUT /api/owner/inquiries/[id] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ✅ DELETE: Delete an inquiry
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const academy = await Academy.findOne({ ownerId: user._id });
    if (!academy) {
      return NextResponse.json({ error: 'No academy found' }, { status: 404 });
    }
    const { id } = await params;
    const inquiry = await Inquiry.findOneAndDelete({ _id: id, academyId: academy._id });
    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/owner/inquiries/[id] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}