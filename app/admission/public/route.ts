// app/api/admission/public/route.ts یا موجودہ POST handler

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Admission from '@/app/models/Admission';
import Owner from '@/app/models/Owner';
import Teacher from '@/app/models/Teacher';
import { sendAdmissionConfirmationEmail } from '@/app/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    // لازمی فیلڈز
    const required = ['name', 'fatherName', 'gender', 'country', 'email', 'contactNumber', 'dateOfBirth', 'feeAmount', 'feeCurrency', 'preferredTiming', 'selectedCourse'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ success: false, error: `${field} is required` }, { status: 400 });
      }
    }

    // ای میل ویلیڈیشن
    if (!/^\S+@\S+\.\S+$/.test(body.email)) {
      return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 400 });
    }

    // واٹس ایپ نمبر ویلیڈیشن (سادہ)
    if (!/^(\+92|0)[0-9]{10}$/.test(body.contactNumber.replace(/\s/g, ''))) {
      return NextResponse.json({ success: false, error: 'Please enter a valid Pakistani WhatsApp number' }, { status: 400 });
    }

    // پہلے سے ای میل یا نمبر سے درخواست؟
    const existing = await Admission.findOne({
      $or: [
        { email: body.email.toLowerCase() },
        { contactNumber: body.contactNumber }
      ],
      currentStatus: { $in: ['pending', 'contacted', 'enrolled', 'in-progress'] }
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'آپ کی درخواست پہلے سے موجود ہے۔ ہم جلد رابطہ کریں گے۔'
      }, { status: 400 });
    }

    let referredByType = null;
    let referredById = null;

    // ریفرل کوڈ چیک (اختیاری)
    if (body.referralCode) {
      const code = body.referralCode.trim().toUpperCase();

      const owner = await Owner.findOne({ referralCode: code });
      if (owner) {
        referredByType = 'owner';
        referredById = owner._id;
      } else {
        const teacher = await Teacher.findOne({ referralCode: code });
        if (teacher) {
          referredByType = 'teacher';
          referredById = teacher._id;
        } else {
          return NextResponse.json({
            success: false,
            error: 'ریفرل کوڈ درست نہیں ہے'
          }, { status: 400 });
        }
      }
    }

    // نیا ایڈمیشن بنائیں
    const admission = await Admission.create({
      ...body,
      email: body.email.toLowerCase(),
      contactNumber: body.contactNumber.trim(),
      feeAmount: parseFloat(body.feeAmount),
      dateOfBirth: new Date(body.dateOfBirth),
      referredByType,
      referredById,
      referralCode: body.referralCode ? body.referralCode.trim().toUpperCase() : undefined,
      currentStatus: 'pending'
    });

    // ای میل بھیجیں
    try {
      await sendAdmissionConfirmationEmail({
        to: body.email,
        name: body.name,
        course: body.selectedCourse,
        phone: body.contactNumber,
        referral: body.referralCode ? ` (${body.referralCode})` : ''
      });
    } catch (e) {
      console.error('Email send failed:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'آپ کی درخواست کامیابی سے جمع ہو گئی! ہم جلد واٹس ایپ پر رابطہ کریں گے۔',
      data: {
        id: admission._id,
        name: admission.name,
        course: admission.selectedCourse,
        referralUsed: !!body.referralCode
      }
    });

  } catch (error: any) {
    console.error('Admission error:', error);
    return NextResponse.json({
      success: false,
      error: 'سرور ایشو۔ براہ مہربانی دوبارہ کوشش کریں۔'
    }, { status: 500 });
  }
}