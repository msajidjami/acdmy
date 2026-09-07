// app/api/admission/submit/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Admission from '@/models/Admission';
import Owner from '@/models/Owner';
import Teacher from '@/models/Teacher';
import { sendAdmissionConfirmationEmail } from '@/app/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    console.log('📩 Received admission form data:', body);

    // لازمی فیلڈز کی فہرست
    const requiredFields = [
      'name',
      'fatherName',
      'gender',
      'country',
      'email',
      'contactNumber',
      'dateOfBirth',
      'feeAmount',
      'feeCurrency',
      'preferredTiming',
      'selectedCourse'
    ];

    // ہر فیلڈ چیک کریں
    for (const field of requiredFields) {
      if (!body[field] || body[field].toString().trim() === '') {
        console.log(`❌ Missing or empty field: ${field}`);
        return NextResponse.json(
          { success: false, error: `${field} درکار ہے` },
          { status: 400 }
        );
      }
    }

    // ای میل ویلیڈیشن
    if (!/^\S+@\S+\.\S+$/.test(body.email.trim())) {
      return NextResponse.json(
        { success: false, error: 'درست ای میل ایڈریس درج کریں' },
        { status: 400 }
      );
    }

    // واٹس ایپ نمبر ویلیڈیشن
    const rawPhone = body.contactNumber.toString().trim();
    const phone = rawPhone.replace(/\s+/g, '');
    if (!/^(\+92|0)[0-9]{10,11}$/.test(phone)) {
      console.log('❌ Invalid phone number:', rawPhone);
      return NextResponse.json(
        { success: false, error: 'درست واٹس ایپ نمبر درج کریں (مثال: 03001234567 یا +923001234567)' },
        { status: 400 }
      );
    }

    // عمر چیک
    const dob = new Date(body.dateOfBirth);
    if (isNaN(dob.getTime())) {
      return NextResponse.json(
        { success: false, error: 'درست تاریخ پیدائش درج کریں' },
        { status: 400 }
      );
    }

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 5) {
      return NextResponse.json(
        { success: false, error: 'طالب علم کی عمر کم از کم 5 سال ہونی چاہیے' },
        { status: 400 }
      );
    }

    // ڈپلیکیٹ چیک
    const existing = await Admission.findOne({
      $or: [
        { email: body.email.toLowerCase().trim() },
        { contactNumber: phone }
      ],
      currentStatus: { $in: ['pending', 'contacted', 'enrolled', 'in-progress'] }
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'ای میل یا واٹس ایپ نمبر سے درخواست پہلے سے موجود ہے۔'
      }, { status: 400 });
    }

    // ریفرل کوڈ چیک (اختیاری)
    let referredByType = null;
    let referredById = null;
    let referralCodeUsed = null;

    if (body.referralCode && body.referralCode.trim() !== '') {
      const code = body.referralCode.trim().toUpperCase();

      const owner = await Owner.findOne({ referralCode: code }).lean();
      if (owner) {
        referredByType = 'owner';
        referredById = owner._id;
        referralCodeUsed = code;
      } else {
        const teacher = await Teacher.findOne({ referralCode: code }).lean();
        if (teacher) {
          referredByType = 'teacher';
          referredById = teacher._id;
          referralCodeUsed = code;
        } else {
          return NextResponse.json({
            success: false,
            error: 'ریفرل کوڈ درست نہیں ہے۔'
          }, { status: 400 });
        }
      }
    }

    // ایڈمیشن سیو کریں
    const admission = await Admission.create({
      name: body.name.trim(),
      fatherName: body.fatherName.trim(),
      gender: body.gender,
      country: body.country,
      email: body.email.toLowerCase().trim(),
      contactNumber: phone,
      dateOfBirth: dob,
      feeAmount: parseFloat(body.feeAmount),
      feeCurrency: body.feeCurrency,
      preferredTiming: body.preferredTiming,
      selectedCourse: body.selectedCourse,
      additionalNotes: body.additionalNotes?.trim() || '',
      platform: body.platform || 'whatsapp',
      currentStatus: 'pending',
      referredByType,
      referredById,
      referralCode: referralCodeUsed,
    });

    console.log('✅ نیا ایڈمیشن کامیابی سے سیو ہو گیا:', admission._id);

    // ای میل بھیجیں
    try {
      await sendAdmissionConfirmationEmail({
        to: body.email,
        name: body.name,
        course: body.selectedCourse,
        applicationId: admission._id.toString(),
        phone: phone // یہاں phone پراپرٹی شامل کی ہے
      });
      console.log('📧 کنفرمیشن ای میل بھیج دی گئی');
    } catch (emailError) {
      console.error('❌ ای میل بھیجنے میں ناکامی:', emailError);
      // ای میل فیل ہونے پر بھی درخواست کامیاب رہے
    }

    return NextResponse.json({
      success: true,
      message: 'درخواست کامیابی سے جمع ہو گئی! ہم جلد واٹس ایپ پر رابطہ کریں گے۔',
      data: {
        id: admission._id.toString(),
        name: admission.name,
        course: admission.selectedCourse,
        contactNumber: admission.contactNumber
      }
    });

  } catch (error: any) {
    console.error('🔥 ایڈمیشن جمع کرنے میں ایرر:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e: any) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        error: 'ای میل یا واٹس ایپ نمبر پہلے سے رجسٹرڈ ہے'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'سرور میں مسئلہ ہے۔ براہ مہربانی دوبارہ کوشش کریں۔'
    }, { status: 500 });
  }
}