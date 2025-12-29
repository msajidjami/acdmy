// app/api/admission/public/route.ts

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

    // لازمی فیلڈز کی جانچ
    const required = [
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

    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // ای میل ویلیڈیشن
    if (!/^\S+@\S+\.\S+$/.test(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // پاکستانی واٹس ایپ نمبر ویلیڈیشن
    const cleanedNumber = body.contactNumber.replace(/\s/g, '');
    if (!/^(\+92|0)[0-9]{10}$/.test(cleanedNumber)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid Pakistani WhatsApp number' },
        { status: 400 }
      );
    }

    // پہلے سے موجود درخواست چیک کریں
    const existing = await Admission.findOne({
      $or: [
        { email: body.email.toLowerCase() },
        { contactNumber: cleanedNumber }
      ],
      currentStatus: { $in: ['pending', 'contacted', 'enrolled', 'in-progress'] }
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'آپ کی درخواست پہلے سے موجود ہے۔ ہم جلد رابطہ کریں گے۔'
        },
        { status: 400 }
      );
    }

    // ریفرل کوڈ چیک (اختیاری)
    let referredByType: 'owner' | 'teacher' | null = null;
    let referredById: string | null = null;

    if (body.referralCode) {
      const code = body.referralCode.trim().toUpperCase();

      const owner = await Owner.findOne({ referralCode: code });
      if (owner) {
        referredByType = 'owner';
        referredById = owner._id.toString();
      } else {
        const teacher = await Teacher.findOne({ referralCode: code });
        if (teacher) {
          referredByType = 'teacher';
          referredById = teacher._id.toString();
        } else {
          return NextResponse.json(
            { success: false, error: 'ریفرل کوڈ درست نہیں ہے' },
            { status: 400 }
          );
        }
      }
    }

    // نیا ایڈمیشن بنائیں
    const newAdmission = new Admission({
      ...body,
      email: body.email.toLowerCase(),
      contactNumber: cleanedNumber,
      feeAmount: parseFloat(body.feeAmount),
      dateOfBirth: new Date(body.dateOfBirth),
      referredByType,
      referredById,
      referralCode: body.referralCode ? body.referralCode.trim().toUpperCase() : undefined,
      currentStatus: 'pending'
    });

    const admission = await newAdmission.save();

    // ای میل بھیجیں — تمام لازمی فیلڈز شامل
    try {
      await sendAdmissionConfirmationEmail({
        to: body.email,
        name: body.name,
        course: body.selectedCourse,
        applicationId: admission._id.toString(),           // لازمی فیلڈ شامل
        phone: body.contactNumber,
        referral: body.referralCode
          ? body.referralCode.trim().toUpperCase()
          : undefined
      });
    } catch (e) {
      console.error('Email send failed:', e);
      // ای میل فیل ہونے پر بھی ایڈمیشن کامیاب رہے
    }

    // کامیاب رسپانس
    return NextResponse.json({
      success: true,
      message: 'آپ کی درخواست کامیابی سے جمع ہو گئی! ہم جلد واٹس ایپ پر رابطہ کریں گے۔',
      data: {
        id: admission._id.toString(),
        name: admission.name,
        course: admission.selectedCourse,
        referralUsed: !!body.referralCode
      }
    });

  } catch (error: any) {
    console.error('Admission error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'سرور ایشو۔ براہ مہربانی دوبارہ کوشش کریں۔'
      },
      { status: 500 }
    );
  }
}