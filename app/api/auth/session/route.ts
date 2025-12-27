// app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import User from '@/app/models/User';
import jwt from 'jsonwebtoken';

// ✅ وہی JWT_SECRET استعمال کریں جو login/signup میں ہے
const JWT_SECRET = process.env.JWT_SECRET || '3927092f8d9e384d86a238c415b982eb';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // ✅ auth_token نام سے ہی کوڈ fetch کریں
    const token = request.cookies.get('auth_token')?.value;
    
    console.log('🔍 Session API - Token found:', !!token);
    console.log('🔍 Session API - JWT_SECRET length:', JWT_SECRET?.length);
    
    if (!token) {
      console.log('❌ Session API - No token found');
      return NextResponse.json({
        success: true,
        user: null
      });
    }

    try {
      // ✅ Token کو decode کر کے دیکھیں پہلے
      const decodedWithoutVerify = jwt.decode(token);
      console.log('🔍 Session API - Decoded token (without verify):', decodedWithoutVerify);
      
      // ✅ اب verify کریں
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        role: string;
        name?: string;
        isVerified?: boolean;
      };
      
      console.log('✅ Session API - Token verified successfully for:', decoded.email);
      
      // ✅ یوزر ڈیٹا fetch کریں
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        console.log('❌ Session API - User not found in database');
        return NextResponse.json({
          success: true,
          user: null
        });
      }

      console.log('✅ Session API - User found:', user.email);
      return NextResponse.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified || false
        }
      });

    } catch (jwtError) {
      console.error('❌ Session API - JWT Error:', jwtError);
      
      // ✅ اگر verify نہ ہو سکے تو development میں decode کر کے ڈیٹا لوٹائیں
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Development mode: Using decode without verify');
        const decoded = jwt.decode(token) as {
          userId: string;
          email: string;
          role: string;
          name?: string;
          isVerified?: boolean;
        } | null;
        
        if (decoded) {
          console.log('✅ Development mode: Returning decoded user:', decoded.email);
          return NextResponse.json({
            success: true,
            user: {
              id: decoded.userId,
              name: decoded.name || decoded.email.split('@')[0],
              email: decoded.email,
              role: decoded.role,
              isVerified: decoded.isVerified || false
            }
          });
        }
      }
      
      return NextResponse.json({
        success: true,
        user: null
      });
    }

  } catch (error: any) {
    console.error('❌ Session API - General error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      user: null
    }, { status: 500 });
  }
}