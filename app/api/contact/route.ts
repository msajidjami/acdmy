// app/api/contact/route.ts

import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Message from '@/models/Message';

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    // Create new message
    const newMessage = new Message({
      name,
      email,
      subject: subject || 'No subject',
      message,
      read: false,
    });

    await newMessage.save();

    return NextResponse.json(
      { success: true, message: 'Your message has been sent successfully.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}