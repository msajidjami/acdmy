import { NextResponse, NextRequest } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';

const JWT_SECRET = process.env.JWT_SECRET!;

interface DecodedToken extends JwtPayload {
  userId?: string;
  id?: string;
  _id?: string;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ roles: [], user: null }, { status: 200 });
    }

    let decoded: DecodedToken;

    try {
      const verified = jwt.verify(token, JWT_SECRET);

      if (typeof verified === 'string') {
        return NextResponse.json({ roles: [], user: null }, { status: 200 });
      }

      decoded = verified as DecodedToken;
    } catch {
      return NextResponse.json({ roles: [], user: null }, { status: 200 });
    }

    // ✅ userId, id, _id — تینوں میں سے کوئی ایک
    const userId = decoded.userId || decoded.id || decoded._id;

    if (!userId) {
      return NextResponse.json({ roles: [], user: null }, { status: 200 });
    }

    await connectDB();

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return NextResponse.json({ roles: [], user: null }, { status: 200 });
    }

    const roles: string[] = [];
    const userObjectId = user._id;
    const email = user.email?.toLowerCase();

    // 1. Admin (صرف schema والا role)
    if (user.role === 'admin') {
      roles.push('admin');
    }

    // 2. Owner — academy کا مالک ہو
    const academy = await Academy.findOne({ ownerId: userObjectId });
    if (academy) {
      roles.push('owner');
    }

    // 3 & 4. Teacher اور Student — email سے (case-insensitive)
    if (email) {
      const emailRegex = new RegExp(`^${email}$`, 'i');

      const teacher = await Teacher.findOne({ email: emailRegex });
      if (teacher) {
        roles.push('teacher');
      }

      const student = await Student.findOne({ email: emailRegex });
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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}