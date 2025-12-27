// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '@/app/models/User';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('🔑 Login attempt for:', email);
    
    // 1. یوزر ڈھونڈیں
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid credentials' 
        },
        { status: 401 }
      );
    }
    
    console.log('👤 User found:', user.email, 'Role:', user.role);
    
    // 2. پاسورڈ چیک کریں
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid credentials' 
        },
        { status: 401 }
      );
    }
    
    // 3. JWT_SECRET چیک کریں
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET || JWT_SECRET.length < 32) {
      console.error('❌ JWT_SECRET is missing or too short');
      return NextResponse.json(
        { 
          success: false,
          error: 'Server configuration error' 
        },
        { status: 500 }
      );
    }
    
    console.log('🔐 JWT_SECRET length:', JWT_SECRET.length);
    
    // 4. JWT Token بنائیں - Session API کے مطابق structure
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name || user.email.split('@')[0],
      isVerified: user.isVerified || false
    };
    
    console.log('📝 Token payload:', tokenPayload);
    
    const token = jwt.sign(
      tokenPayload,
      JWT_SECRET, // ✅ صرف JWT_SECRET استعمال کریں، fallback نہیں
      { expiresIn: '7d' }
    );
    
    console.log('✅ Token created successfully');
    console.log('🔍 Token (first 50 chars):', token.substring(0, 50) + '...');
    
    // 5. Response بنائیں
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Login successful',
        user: {
          userId: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified || false
        }
      },
      { status: 200 }
    );
    
    // 6. Cookie میں token سیٹ کریں - **'token' نام سے**
    response.cookies.set({
      name: 'token', // ✅ یہ وہی نام ہونا چاہیے جو session API میں تلاش کر رہے ہیں
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 دن
      path: '/',
    });
    
    // 7. Additional cookie (optional) - صرف اگر آپ کو چاہیے
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: false, // Client-side accessible
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    
    console.log('🍪 Cookies set successfully');
    
    return response;
    
  } catch (error: any) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}