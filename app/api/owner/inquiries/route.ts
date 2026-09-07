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

// GET: all inquiries
export async function GET(req: NextRequest) {
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

    const inquiries = await Inquiry.find({ academyId: academy._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(inquiries);
  } catch (error) {
    console.error('GET /api/owner/inquiries error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT: update inquiry status (supports new, pending, read, replied, archived)
export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const { inquiryId, status, notes } = body;

    if (!inquiryId) {
      return NextResponse.json({ error: 'Inquiry ID required' }, { status: 400 });
    }

    const inquiry = await Inquiry.findOne({ _id: inquiryId, academyId: academy._id });
    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    // ✅ اگر status کو read کرنا ہے یا new/pending کو read بنانا ہے
    if (status === 'read') {
      inquiry.status = 'read';
    } else if (status) {
      inquiry.status = status;
    }

    if (notes !== undefined) {
      inquiry.notes = notes;
    }

    if (inquiry.status === 'replied') {
      inquiry.repliedAt = new Date();
      inquiry.repliedBy = user._id;
    }

    await inquiry.save();
    return NextResponse.json(inquiry);
  } catch (error) {
    console.error('PUT /api/owner/inquiries error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}