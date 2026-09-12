import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';

import connectDB from '@/app/lib/dbConnect';
import Student from '@/models/Student';
import Academy from '@/models/Academy';
import User from '@/models/User';
import Message from '@/models/Message';

import { ArrowLeft } from 'lucide-react';
import MessagesView from './MessagesView';

export const dynamic = 'force-dynamic';

export default async function StudentMessagesPage() {
  /* ---------- Auth ---------- */
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is not configured');

  let decoded: any;
  try {
    decoded = jwt.verify(token, jwtSecret);
  } catch {
    redirect('/login');
  }

  const email = String(decoded?.email || '').trim().toLowerCase();
  if (!email) redirect('/login');

  /* ---------- DB ---------- */
  await connectDB();

  const user = await User.findOne({ email }).select('_id name email').lean();
  if (!user) redirect('/login');

  const student = await Student.findOne({ email })
    .select('_id name email academyId classLevel imageUrl')
    .lean();

  /* ---------- No Academy ---------- */
  if (!student?.academyId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <div className="rounded-3xl border-2 border-dashed border-sky-200 bg-white p-12">
          <div className="text-5xl mb-4">🏫</div>
          <h2 className="text-2xl font-bold text-slate-800">
            No Academy Assigned
          </h2>
          <p className="mt-2 text-slate-500">
            You need to be part of an academy to send messages.
          </p>
          <Link
            href="/student/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 px-6 py-3 text-sm font-bold text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- Academy + Messages ---------- */
  const academy = await Academy.findById(student.academyId)
    .select('name slug logo accentColor')
    .lean();

  const messages = await Message.find({
    studentUserId: (user as any)._id,
    academyId: student.academyId,
  })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-0 pb-10">
      <Link
        href="/student/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600 transition group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      <MessagesView
        academy={
          academy
            ? {
                _id: String((academy as any)._id),
                name: String((academy as any).name || ''),
                slug: String((academy as any).slug || ''),
                logo: String((academy as any).logo || ''),
                accentColor: String(
                  (academy as any).accentColor || '#0ea5e9'
                ),
              }
            : null
        }
        student={{
          _id: String((student as any)._id),
          name: String((student as any).name || 'Student'),
          email: String((student as any).email || ''),
          classLevel: String((student as any).classLevel || ''),
        }}
        initialMessages={messages.map((m: any) => ({
          _id: String(m._id),
          subject: String(m.subject || ''),
          text: String(m.text || ''),
          category: String(m.category || 'general'),
          priority: String(m.priority || 'normal'),
          status: String(m.status || 'unread'),
          replies: Array.isArray(m.replies)
            ? m.replies.map((r: any) => ({
                _id: String(r._id),
                senderRole: String(r.senderRole || ''),
                senderName: String(r.senderName || ''),
                text: String(r.text || ''),
                createdAt: r.createdAt
                  ? new Date(r.createdAt).toISOString()
                  : null,
              }))
            : [],
          createdAt: m.createdAt
            ? new Date(m.createdAt).toISOString()
            : null,
          repliedAt: m.repliedAt
            ? new Date(m.repliedAt).toISOString()
            : null,
        }))}
      />
    </div>
  );
}