import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Course from '@/models/Course';
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
    const course = await Course.findOne({ _id: id, academyId: academy._id });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, image, price, duration, level, category, isActive } = body;

    if (title) course.title = title;
    if (description !== undefined) course.description = description;
    if (image !== undefined) course.image = image;
    if (price !== undefined) course.price = price;
    if (duration !== undefined) course.duration = duration;
    if (level) course.level = level;
    if (category !== undefined) course.category = category;
    if (typeof isActive === 'boolean') course.isActive = isActive;

    await course.save();
    return NextResponse.json(course);
  } catch (error) {
    console.error('PUT /api/owner/courses/[id] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

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
    const course = await Course.findOneAndDelete({
      _id: id,
      academyId: academy._id,
    });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/owner/courses/[id] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}