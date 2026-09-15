// app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// ============================================================
// Types
// ============================================================
type UserRole = 'admin' | 'owner' | 'teacher' | 'user' | 'student';

const PUBLIC_ROLES: readonly UserRole[] = ['user', 'student', 'owner'] as const;
const VALID_ROLES: readonly UserRole[] = [
  'admin',
  'owner',
  'teacher',
  'user',
  'student',
] as const;

// ============================================================
// Helpers
// ============================================================
function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
}

function isValidEmail(email: string): boolean {
  // سادہ لیکن کافی email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

// ============================================================
// POST /api/auth/signup
// ============================================================
export async function POST(request: NextRequest) {
  try {
    // ✅ env var کو request کے وقت پڑھیں (serverless میں محفوظ)
    const ADMIN_SECRET = process.env.ADMIN_SECRET;

    // ---------- Body parse ----------
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonError('Invalid request body.', 400);
    }

    const { name, email, password, role, secretCode } = body ?? {};

    // ---------- Required fields ----------
    if (!name || !email || !password || !role) {
      return jsonError('All required fields are required.', 400);
    }

    // ---------- Normalize ----------
    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanRole = String(role).trim().toLowerCase() as UserRole;
    const cleanPassword = String(password);
    const cleanSecretCode =
      typeof secretCode === 'string' ? secretCode.trim() : '';

    // ---------- Validate name ----------
    if (cleanName.length < 2 || cleanName.length > 60) {
      return jsonError('Name must be between 2 and 60 characters.', 400);
    }

    // ---------- Validate email ----------
    if (!isValidEmail(cleanEmail)) {
      return jsonError('Invalid email address.', 400);
    }

    if (!cleanEmail.endsWith('@gmail.com')) {
      return jsonError('Only Gmail addresses are allowed.', 400);
    }

    // ---------- Validate password ----------
    if (cleanPassword.length < 6) {
      return jsonError('Password must be at least 6 characters.', 400);
    }

    if (cleanPassword.length > 128) {
      return jsonError('Password is too long.', 400);
    }

    // ---------- Validate role ----------
    if (!VALID_ROLES.includes(cleanRole)) {
      return jsonError('Invalid account type.', 400);
    }

    // عوامی طور پر صرف یہ 3 roles منتخب ہو سکتے ہیں
    if (!PUBLIC_ROLES.includes(cleanRole)) {
      return jsonError('Invalid account type.', 400);
    }

    // ---------- Admin secret (optional) ----------
    let finalRole: UserRole = cleanRole;

    if (cleanSecretCode) {
      if (!ADMIN_SECRET) {
        console.error('❌ ADMIN_SECRET is not configured in env vars');
        return jsonError('Admin registration is currently unavailable.', 500);
      }

      if (cleanSecretCode !== ADMIN_SECRET) {
        return jsonError('Invalid admin secret code.', 400);
      }

      finalRole = 'admin';
    }

    // ---------- DB connect ----------
    await connectDB();

    // ---------- Existing user check ----------
    const existingUser = await User.findOne({ email: cleanEmail })
      .select('_id')
      .lean();

    if (existingUser) {
      return jsonError('Email already registered.', 409);
    }

    // ---------- Create user ----------
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