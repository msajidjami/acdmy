import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';

export async function POST(request: NextRequest) {
  try {
    const { userId, email, role } = await request.json();
    
    if (!userId || !email || !role) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new token
    const token = jwt.sign(
      {
        userId,
        email,
        role,
        isVerified: false,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      },
      JWT_SECRET
    );
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Token created successfully',
      token: token,
      user: { userId, email, role }
    });
    
    // Set cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
    
    return response;
    
  } catch (error: any) {
    console.error('Fix token error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create token' },
      { status: 500 }
    );
  }
}