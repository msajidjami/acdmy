import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

// ----- Helper to check MongoDB duplicate key error -----
function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as any).code === 11000
  );
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const { name, email, password, role, secretCode } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: 'All required fields are required.' },
        { status: 400 }
      );
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanRole = String(role).trim().toLowerCase();

    if (!cleanName) {
      return NextResponse.json(
        { message: 'Name is required.' },
        { status: 400 }
      );
    }

    if (!cleanEmail.endsWith('@gmail.com')) {
      return NextResponse.json(
        { message: 'Only Gmail addresses are allowed.' },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const PUBLIC_ROLES = ['user', 'student', 'owner'];
    if (!PUBLIC_ROLES.includes(cleanRole)) {
      return NextResponse.json(
        { message: 'Invalid account type.' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered.' },
        { status: 400 }
      );
    }

    let finalRole = cleanRole;

    if (secretCode) {
      if (!ADMIN_SECRET) {
        console.error('ADMIN_SECRET is not configured in environment variables.');
        return NextResponse.json(
          { message: 'Admin registration is currently unavailable.' },
          { status: 500 }
        );
      }

      if (secretCode !== ADMIN_SECRET) {
        return NextResponse.json(
          { message: 'Invalid admin secret code.' },
          { status: 400 }
        );
      }

      finalRole = 'admin';
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: finalRole,
      isVerified: false,
    });

    return NextResponse.json(
      {
        message: 'User created successfully.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);

    // Check for MongoDB duplicate key error (code 11000)
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { message: 'Email already registered.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error.' },
      { status: 500 }
    );
  }
}