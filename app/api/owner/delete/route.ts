import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.redirect(new URL('/login', request.url));

    let userId = '';
    let userRole = '';
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
      userRole = decoded.role;
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const academyId = searchParams.get('id');
    if (!academyId) {
      return NextResponse.json({ error: 'Academy ID required' }, { status: 400 });
    }

    await connectDB();
    const academy = await Academy.findOne({ _id: academyId, ownerId: userId });
    if (!academy) {
      return NextResponse.json({ error: 'Academy not found' }, { status: 404 });
    }

    await academy.deleteOne();
    return NextResponse.redirect(new URL('/owner/dashboard?deleted=true', request.url));
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}