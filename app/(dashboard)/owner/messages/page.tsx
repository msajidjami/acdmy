import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';

import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import User from '@/models/User';
import Student from '@/models/Student';
import Message from '@/models/Message';

import { ArrowLeft } from 'lucide-react';
import OwnerMessagesView from './OwnerMessagesView';

export const dynamic = 'force-dynamic';

export default async function OwnerMessagesPage() {
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

  const userId = String(decoded?.userId || '');
  if (!userId) redirect('/login');

  /* ---------- DB ---------- */
  await connectDB();

  const user = await User.findById(userId)
    .select('_id name email role')
    .lean();
  if (!user) redirect('/login');

  const academy = await Academy.findOne({ ownerId: (user as any)._id })
    .select('_id name slug logo accentColor')
    .lean();

  if (!academy) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <div className="rounded-3xl border-2 border-dashed border-emerald-200 bg-white p-12">
          <div className="text-5xl mb-4">🏫</div>
          <h2 className="text-2xl font-bold text-slate-800">No Academy Yet</h2>
          <p className="mt-2 text-slate-500">
            Create your academy first to receive student messages.
          </p>
          <Link
            href="/owner/academy"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-sm font-bold text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Create Academy
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- Messages ---------- */
  const messages = await Message.find({ academyId: (academy as any)._id })
    .sort({ createdAt: -1 })
    .lean();

  const studentIds = Array.from(
    new Set(
      messages
        .map((m: any) => String(m.studentId || ''))
        .filter((x: string) => x.length > 0)
    )
  );

  const students =
    studentIds.length > 0
      ? await Student.find({ _id: { $in: studentIds } })
          .select('_id name email classLevel imageUrl')
          .lean()
      : [];

  const studentMap = new Map(
    students.map((s: any) => [
      String(s._id),
      {
        name: String(s.name || 'Student'),
        email: String(s.email || ''),
        classLevel: String(s.classLevel || ''),
        imageUrl: String(s.imageUrl || ''),
      },
    ])
  );

  const serialized = messages.map((m: any) => {
    const s = studentMap.get(String(m.studentId));
    return {
      _id: String(m._id),
      subject: String(m.subject || ''),
      text: String(m.text || ''),
      category: String(m.category || 'general'),
      priority: String(m.priority || 'normal'),
      status: String(m.status || 'unread'),
      studentId: String(m.studentId),
      studentName: s?.name || 'Student',
      studentEmail: s?.email || '',
      studentClassLevel: s?.classLevel || '',
      studentImageUrl: s?.imageUrl || '',
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
    };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-0 pb-10">
      <Link
        href="/owner/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      <OwnerMessagesView
        academy={{
          _id: String((academy as any)._id),
          name: String((academy as any).name || ''),
          slug: String((academy as any).slug || ''),
          logo: String((academy as any).logo || ''),
          accentColor: String((academy as any).accentColor || '#10b981'),
        }}
        owner={{
          _id: String((user as any)._id),
          name: String((user as any).name || 'Owner'),
          email: String((user as any).email || ''),
        }}
        initialMessages={serialized}
      />
    </div>
  );
}