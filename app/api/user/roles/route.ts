import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ roles: [], user: null }, { status: 200 });
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
      return NextResponse.json({ roles: [], user: null }, { status: 200 });
    }

    await connectDB();

    // صارف کو userId سے ڈھونڈیں
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return NextResponse.json({ roles: [], user: null }, { status: 200 });
    }

    const roles: string[] = [];
    const userId = user._id;
    const email = user.email?.toLowerCase(); // ✅ کیس انسینسیٹو

    // 1. Admin
    if (user.role === 'admin') {
      roles.push('admin');
    }

    // 2. Owner
    const academy = await Academy.findOne({ ownerId: userId });
    if (academy) {
      roles.push('owner');
    }

    // 3. Teacher - email سے ڈھونڈیں (کیس انسینسیٹو)
    if (email) {
      const teacher = await Teacher.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
      if (teacher) {
        roles.push('teacher');
      }

      // 4. Student - email سے ڈھونڈیں (کیس انسینسیٹو)
      const student = await Student.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
      if (student) {
        roles.push('student');
      }
    }

    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    return NextResponse.json({ roles, user: userData });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}