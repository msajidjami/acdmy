import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/dbConnect';
import Inquiry from '@/models/Inquiry';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';
import Course from '@/models/Course';
import User from '@/models/User';
import { generateAIReply, AIReplyContext } from '@/app/lib/aiReply';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET!;

async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    await connectDB();
    return await User.findById(decoded.userId).select('-password').lean();
  } catch {
    return null;
  }
}

/* ============================================================
   GET — چیٹ تھریڈ حاصل کریں
   ============================================================ */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await connectDB();
    const inquiry = await Inquiry.findById(id).lean();
    if (!inquiry) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        _id: String(inquiry._id),
        academyId: String(inquiry.academyId),
        teacherId: (inquiry as any).teacherId
          ? String((inquiry as any).teacherId)
          : null,
        visitorName: String(inquiry.visitorName || ''),
        visitorEmail: String(inquiry.visitorEmail || ''),
        message: String(inquiry.message || ''),
        replies: ((inquiry as any).replies || []).map((r: any) => ({
          _id: String(r._id),
          senderType: r.senderType,
          senderName: r.senderName,
          text: r.text,
          createdAt: r.createdAt,
        })),
        status: String(inquiry.status || 'pending'),
        createdAt: inquiry.createdAt,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('❌ Get inquiry error:', error);
    return NextResponse.json(
      { error: 'Failed to load inquiry' },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST — نیا پیغام + AI خودکار جواب (Teacher + Courses context کے ساتھ)
   ============================================================ */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const text = String(body.text || '').trim().slice(0, 2000);
    if (text.length < 1) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    await connectDB();
    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    /* ✅ Academy کی مکمل تفصیلات AI کو دینے کے لیے */
    const academy = await Academy.findById(inquiry.academyId)
      .select('ownerId name slug description address contactEmail')
      .lean();

    if (!academy) {
      return NextResponse.json(
        { error: 'Academy not found' },
        { status: 404 }
      );
    }

    /* کون بھیج رہا ہے؟ Owner یا User؟ */
    const isOwner = String(academy.ownerId) === String((user as any)._id);
    const isVisitor =
      String(inquiry.visitorEmail).toLowerCase() ===
      String((user as any).email || '').toLowerCase();

    if (!isOwner && !isVisitor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    /* ✅ AI کو دینے کے لیے پہلے ہی موجود replies محفوظ کر لیں
       (نیا user reply شامل کرنے سے پہلے) */
    const priorReplies = ((inquiry as any).replies || []).map((r: any) => ({
      senderType: r.senderType,
      text: r.text,
    }));

    /* ✅ User/Owner کا پیغام اب push کریں */
    const userReply: any = {
      senderType: isOwner ? 'owner' : 'user',
      senderName: String((user as any).name || 'User'),
      senderId: (user as any)._id,
      text,
      createdAt: new Date(),
    };

    (inquiry as any).replies.push(userReply);

    /* ✅ اگر صارف (visitor) نے پیغام بھیجا تو AI فوراً جواب دے */
    let botReply: any = null;

    if (!isOwner) {
      try {
        /* ✅ Courses + Teachers + focusedTeacher لوڈ کریں */
        const teacherId = (inquiry as any).teacherId;

        const [courses, teachers, focusedTeacher] = await Promise.all([
          Course.find({ academyId: academy._id, isActive: true })
            .select('title description price level')
            .limit(20)
            .lean(),
          Teacher.find({ academyId: academy._id, isAvailable: true })
            .select('name subjects bio')
            .limit(20)
            .lean(),
          teacherId && mongoose.Types.ObjectId.isValid(String(teacherId))
            ? Teacher.findById(teacherId)
                .select('name subjects bio')
                .lean()
            : Promise.resolve(null),
        ]);

        const extraContext: AIReplyContext = {
          courses: courses.map((c: any) => ({
            title: String(c.title || ''),
            description: String(c.description || ''),
            price: Number(c.price) || 0,
            level: String(c.level || ''),
          })),
          teachers: teachers.map((t: any) => ({
            name: String(t.name || ''),
            subjects: Array.isArray(t.subjects) ? t.subjects : [],
            bio: String(t.bio || ''),
          })),
          focusedTeacher: focusedTeacher
            ? {
                name: String((focusedTeacher as any).name || ''),
                subjects: Array.isArray((focusedTeacher as any).subjects)
                  ? (focusedTeacher as any).subjects
                  : [],
                bio: String((focusedTeacher as any).bio || ''),
              }
            : undefined,
        };

        /* ✅ AI کو دیں:
           - نیا پیغام (text)
           - پچھلی گفتگو (priorReplies — بغیر نئے پیغام کے)
           - پہلا user پیغام (inquiry.message) تاکہ history 'user' سے شروع ہو
           - extraContext (courses, teachers, focusedTeacher)
        */
        const aiText = await generateAIReply(
          text,
          academy,
          priorReplies,
          String(inquiry.message || ''),
          extraContext
        );

        botReply = {
          senderType: 'bot',
          senderName: focusedTeacher
            ? `${(focusedTeacher as any).name}'s Assistant`
            : `${(academy as any).name} Assistant`,
          text: aiText,
          createdAt: new Date(),
        };

        (inquiry as any).replies.push(botReply);

        /* status pending رہے تاکہ owner بعد میں جواب دے سکے */
        inquiry.status = 'pending';
      } catch (aiError) {
        console.error('⚠️ AI reply failed:', aiError);
      }
    } else {
      /* Owner نے جواب دیا تو replied */
      inquiry.status = 'replied';
    }

    await inquiry.save();

    return NextResponse.json(
      {
        success: true,
        reply: {
          _id: String(userReply._id),
          senderType: userReply.senderType,
          senderName: userReply.senderName,
          text: userReply.text,
          createdAt: userReply.createdAt,
        },
        botReply: botReply
          ? {
              _id: String(botReply._id),
              senderType: botReply.senderType,
              senderName: botReply.senderName,
              text: botReply.text,
              createdAt: botReply.createdAt,
            }
          : null,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('❌ Add reply error:', error);
    return NextResponse.json(
      { error: 'Failed to add reply' },
      { status: 500 }
    );
  }
}