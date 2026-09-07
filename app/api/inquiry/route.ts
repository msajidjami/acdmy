import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Inquiry from '@/models/Inquiry';
import Academy from '@/models/Academy';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const formData = await request.formData();

    const academyId = formData.get('academyId') as string;
    const visitorName = formData.get('visitorName') as string;
    const visitorEmail = formData.get('visitorEmail') as string;
    const message = formData.get('message') as string;

    if (!academyId || !visitorName || !visitorEmail || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // چیک کریں کہ اکیڈمی موجود ہے
    const academy = await Academy.findById(academyId);
    if (!academy) {
      return NextResponse.json(
        { error: 'Academy not found' },
        { status: 404 }
      );
    }

    // ✅ انکوائری محفوظ کریں – status کو 'new' استعمال کریں (کیونکہ 'pending' enum میں نہیں)
    const inquiry = await Inquiry.create({
      academyId,
      name: visitorName,      // ماڈل میں فیلڈ کا نام 'name' ہے
      email: visitorEmail,    // اور 'email'
      message,
      status: 'new',          // ✅ یہاں 'new' استعمال کریں
    });

    // (اختیاری) Owner کو ای میل نوٹیفکیشن بھیج سکتے ہیں

    // کامیابی کے ساتھ ہوم پیج پر واپس جائیں
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Error creating inquiry:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}