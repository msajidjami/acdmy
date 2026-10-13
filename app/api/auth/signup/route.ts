import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

type UserRole = 'admin' | 'user';

const DEFAULT_ROLE: UserRole = 'user';

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const ADMIN_SECRET = process.env.ADMIN_SECRET;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonError('Invalid request body.', 400);
    }

    const { name, email, password, secretCode } = body ?? {};

    if (!name || !email || !password) {
      return jsonError('All required fields are required.', 400);
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);
    const cleanSecretCode =
      typeof secretCode === 'string' ? secretCode.trim() : '';

    if (cleanName.length < 2 || cleanName.length > 60) {
      return jsonError('Name must be between 2 and 60 characters.', 400);
    }
    if (!isValidEmail(cleanEmail)) {
      return jsonError('Invalid email address.', 400);
    }
    if (!cleanEmail.endsWith('@gmail.com')) {
      return jsonError('Only Gmail addresses are allowed.', 400);
    }
    if (cleanPassword.length < 6) {
      return jsonError('Password must be at least 6 characters.', 400);
    }
    if (cleanPassword.length > 128) {
      return jsonError('Password is too long.', 400);
    }

    /* ✅ Role: default "user"؛ admin صرف صحیح secret code سے */
    let finalRole: UserRole = DEFAULT_ROLE;

    if (cleanSecretCode) {
      if (!ADMIN_SECRET) {
        console.error('❌ ADMIN_SECRET is not configured');
        return jsonError('Admin registration is currently unavailable.', 500);
      }
      if (cleanSecretCode !== ADMIN_SECRET) {
        return jsonError('Invalid admin secret code.', 400);
      }
      finalRole = 'admin';
    }

    await connectDB();

    const existingUser = await User.findOne({ email: cleanEmail })
      .select('_id')
      .lean();

    if (existingUser) {
      return jsonError('Email already registered.', 409);
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: finalRole,
      provider: 'credentials',
      isVerified: false,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully.',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Signup error:', error);
    if (isDuplicateKeyError(error)) {
      return jsonError('Email already registered.', 409);
    }
    return jsonError('Something went wrong. Please try again.', 500);
  }
}