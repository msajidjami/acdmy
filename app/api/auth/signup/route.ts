import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'Adm!nP@ssw0rd313';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, email, password, secretCode } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    if (!email.endsWith('@gmail.com')) {
      return NextResponse.json({ message: 'Only Gmail addresses are allowed' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 400 });
    }

    // 🧠 کردار کا فیصلہ: اگر سیکرٹ کوڈ درست ہے تو ایڈمن، ورنہ طالب علم
    let role = 'student';
    if (secretCode && secretCode === ADMIN_SECRET) {
      role = 'admin';
    } else if (secretCode && secretCode !== ADMIN_SECRET) {
      return NextResponse.json({ message: 'Invalid secret code' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      isVerified: false,
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}