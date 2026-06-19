// app/admin/messages/page.tsx

import { Metadata } from 'next';
import connectDB from '@/app/lib/dbConnect';
import Message from '@/app/models/Message';
import MessagesClient from './MessagesClient';

export const metadata: Metadata = {
  title: 'Admin – Messages | Quran & Islamic Academy',
  description: 'View all messages submitted through the contact form.',
};

export default async function AdminMessagesPage() {
  await connectDB();
  const messages = await Message.find({}).sort({ createdAt: -1 }).lean();

  // Convert _id and dates to strings for client-side rendering
  const serializedMessages = messages.map((msg: any) => ({
    ...msg,
    _id: msg._id.toString(),
    createdAt: msg.createdAt.toISOString(),
  }));

  return <MessagesClient initialMessages={serializedMessages} />;
}