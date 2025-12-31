// app/api/users/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'G3NQE3QHMqYQQ6KwNNlE1dk4MBSSqK3lqtRMyAZPF6JK9YpjSuwD42OpN+PMYZ5W';

interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
}

async function authenticate(req: Request): Promise<AuthTokenPayload | null> {
  // cookies() async ہے، await ضروری ہے
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch (error) {
    console.error('JWT Verify Error:', error);
    return null;
  }
}

export async function GET(req: Request) {
  await dbConnect();

  const user = await authenticate(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ message: 'اجازت نہیں ہے' }, { status: 403 });
  }

  try {
    const users = await User.find({})
      .select('email role name') // name بھی شامل کیا تاکہ ٹیبل میں دکھائی دے
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Users GET Error:', error);
    return NextResponse.json({ message: 'سرور ایرر' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  await dbConnect();

  const user = await authenticate(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ message: 'اجازت نہیں ہے' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'یوزر ID درکار ہے' }, { status: 400 });
  }

  try {
    // خود کو ڈیلیٹ نہ کرنے دیں (سیکیورٹی)
    if (user.userId === userId) {
      return NextResponse.json({ message: 'آپ خود کو ڈیلیٹ نہیں کر سکتے' }, { status: 400 });
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return NextResponse.json({ message: 'یوزر نہیں ملا' }, { status: 404 });
    }

    return NextResponse.json({ message: 'یوزر کامیابی سے ڈیلیٹ ہو گیا' }, { status: 200 });
  } catch (error) {
    console.error('Users DELETE Error:', error);
    return NextResponse.json({ message: 'سرور ایرر' }, { status: 500 });
  }
}