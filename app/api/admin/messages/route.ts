// app/api/admin/messages/route.ts

import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Message from '@/models/Message';

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { messageId, read } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    }

    const updated = await Message.findByIdAndUpdate(
      messageId,
      { read },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    }

    const deleted = await Message.findByIdAndDelete(messageId);
    if (!deleted) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}