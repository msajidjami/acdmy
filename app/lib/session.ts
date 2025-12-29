import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// ✅ **SessionData interface - TypeScript error fix**
export interface SessionData {
  userId: string;
  email: string;
  role: string;
  isVerified: boolean;
  name: string;
}

// ✅ **JWT_SECRET کی تصدیق کے لیے helper function**
function validateJwtSecret(): string {
  const JWT_SECRET = process.env.JWT_SECRET;
  
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  if (JWT_SECRET.length < 32) {
    throw new Error(`JWT_SECRET is too short (${JWT_SECRET.length} chars). Minimum 32 characters required.`);
  }
  
  return JWT_SECRET;
}

// ✅ **Token حاصل کرنے کے لیے helper function**
function getTokenFromRequest(request: NextRequest): string | null {
  // 1. Authorization header سے
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 2. مختلف ممکنہ cookie names سے
  const possibleCookieNames = [
    'token',           
    'auth_token',      
    'auth-token',      
    'session',         
    'jwt',             
    'next-auth.session-token',
    '__Secure-next-auth.session-token'
  ];
  
  for (const cookieName of possibleCookieNames) {
    const token = request.cookies.get(cookieName)?.value;
    if (token) {
      console.log(`🔍 Found token in cookie: ${cookieName}`);
      return token;
    }
  }
  
  return null;
}

// ✅ **getSession function - TypeScript compatible**
export async function getSession(request?: NextRequest): Promise<SessionData | null> {
  if (!request) {
    console.warn('⚠️ getSession called without request object');
    return null;
  }

  try {
    const response = await GET(request);
    const data = await response.json();
    
    if (data.success && data.user) {
      return {
        userId: data.user.userId,
        email: data.user.email,
        role: data.user.role,
        isVerified: data.user.isVerified,
        name: data.user.name
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ getSession error:', error);
    return null;
  }
}

// ✅ **API Route Handlers**
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Session API called - GET method');
    
    let JWT_SECRET: string;
    try {
      JWT_SECRET = validateJwtSecret();
    } catch (secretError: any) {
      console.error('❌ JWT_SECRET validation failed:', secretError.message);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server configuration error',
          details: secretError.message
        },
        { status: 500 }
      );
    }
    
    console.log('🔐 JWT_SECRET configured:', `[Length: ${JWT_SECRET.length} chars]`);
    
    const token = getTokenFromRequest(request);
    
    if (!token) {
      const allCookies = Array.from(request.cookies.getAll());
      console.log('📋 Available cookies:', allCookies.map(c => ({ name: c.name, length: c.value.length })));
      console.log('❌ No authentication token found');
      
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        user: null,
        message: 'Please login to access this resource'
      }, { status: 401 });
    }
    
    console.log('✅ Token found');
    console.log('🔑 Token details:', {
      length: token.length,
      first10Chars: token.substring(0, 10) + '...',
      last10Chars: '...' + token.substring(token.length - 10)
    });
    
    try {
      const decodedWithoutVerify = jwt.decode(token, { complete: true });
      
      if (!decodedWithoutVerify) {
        console.error('❌ Token could not be decoded');
        return NextResponse.json({
          success: false,
          error: 'Invalid token format',
          user: null
        }, { status: 401 });
      }
      
      console.log('🔍 Token header:', decodedWithoutVerify.header);
      console.log('🔍 Token payload (without verify):', decodedWithoutVerify.payload);
      
      console.log('🔐 Attempting to verify token...');
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        role: string;
        isVerified?: boolean;
        name?: string;
        iat: number;
        exp: number;
        [key: string]: any;
      };
      
      console.log('✅ Token verified successfully!');
      
      const currentTime = Math.floor(Date.now() / 1000);
      const expiresInSeconds = decoded.exp - currentTime;
      
      if (expiresInSeconds <= 0) {
        console.log(`⚠️ Token expired ${Math.abs(expiresInSeconds)} seconds ago`);
        return NextResponse.json({
          success: false,
          error: 'Token expired',
          user: null,
          details: {
            expiredAt: new Date(decoded.exp * 1000).toISOString(),
            currentTime: new Date().toISOString()
          }
        }, { status: 401 });
      }
      
      const userData = {
        userId: decoded.userId || decoded.id || decoded.sub,
        email: decoded.email,
        role: decoded.role || 'user',
        isVerified: decoded.isVerified || false,
        name: decoded.name || decoded.email?.split('@')[0] || 'User'
      };
      
      console.log('👤 User authenticated:', {
        email: userData.email,
        role: userData.role,
        userId: userData.userId?.substring(0, 8) + '...'
      });
      
      return NextResponse.json({
        success: true,
        user: userData,
        tokenInfo: {
          issuedAt: new Date(decoded.iat * 1000).toISOString(),
          expiresAt: new Date(decoded.exp * 1000).toISOString(),
          expiresIn: {
            seconds: expiresInSeconds,
            minutes: Math.floor(expiresInSeconds / 60),
            hours: Math.floor(expiresInSeconds / 3600),
            days: Math.floor(expiresInSeconds / 86400)
          },
          algorithm: decodedWithoutVerify.header.alg
        },
        meta: {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV
        }
      });
      
    } catch (verifyError: any) {
      console.error('❌ JWT Verification Failed:', verifyError.name);
      console.error('❌ Error message:', verifyError.message);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development Debug Information:');
        console.log('🔧 JWT_SECRET (first 5 chars):', JWT_SECRET.substring(0, 5) + '...');
        
        try {
          const decoded = jwt.decode(token, { complete: true });
          console.log('🔧 Decoded token structure:', {
            header: decoded?.header,
            payload: decoded?.payload
          });
          
          if (decoded?.payload) {
            console.log('⚠️ DEVELOPMENT MODE: Returning user without verification');
            
            const payload = decoded.payload as any;
            return NextResponse.json({
              success: true,
              user: {
                userId: payload.userId || payload.id || payload.sub,
                email: payload.email,
                role: payload.role || 'user',
                isVerified: payload.isVerified || false,
                name: payload.name || payload.email?.split('@')[0] || 'User'
              },
              warning: 'DEVELOPMENT MODE: Token verification bypassed for debugging',
              debug: {
                verificationError: {
                  name: verifyError.name,
                  message: verifyError.message,
                  stack: verifyError.stack
                }
              }
            });
          }
        } catch (decodeError) {
          console.error('❌ Token decode error in development:', decodeError);
        }
      }
      
      let errorMessage = 'Authentication failed';
      let statusCode = 401;
      
      switch (verifyError.name) {
        case 'JsonWebTokenError':
          errorMessage = 'Invalid authentication token';
          break;
        case 'TokenExpiredError':
          errorMessage = 'Your session has expired. Please login again.';
          break;
        case 'NotBeforeError':
          errorMessage = 'Token not yet valid';
          break;
        default:
          errorMessage = 'Authentication error';
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        user: null,
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            errorType: verifyError.name,
            message: verifyError.message,
            suggestion: 'Check server logs for more details'
          }
        })
      }, { status: statusCode });
    }
    
  } catch (error: any) {
    console.error('❌ Session API Unexpected Error:', error);
    console.error('❌ Stack trace:', error.stack);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      user: null,
      ...(process.env.NODE_ENV === 'development' && {
        details: {
          message: error.message,
          stack: error.stack
        }
      })
    }, { status: 500 });
  }
}

// ✅ **Diagnostic endpoint (POST method)**
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Session API called - POST method (Diagnostic)');
    
    const JWT_SECRET = process.env.JWT_SECRET;
    const allCookies = Array.from(request.cookies.getAll());
    
    const diagnostics = {
      server: {
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        platform: process.platform,
        nodeVersion: process.version
      },
      jwt: {
        secretExists: !!JWT_SECRET,
        secretLength: JWT_SECRET?.length,
        secretPreview: JWT_SECRET ? `${JWT_SECRET.substring(0, 3)}...${JWT_SECRET.substring(JWT_SECRET.length - 3)}` : null,
        isSecretValid: JWT_SECRET ? JWT_SECRET.length >= 32 : false
      },
      cookies: {
        count: allCookies.length,
        list: allCookies.map(cookie => ({
          name: cookie.name,
          valueLength: cookie.value.length,
          isToken: cookie.name.includes('token') || cookie.name.includes('auth'),
          preview: cookie.value.substring(0, 20) + '...'
        }))
      },
      headers: {
        authorization: request.headers.get('authorization') ? 'Present' : 'Not present',
        userAgent: request.headers.get('user-agent'),
        host: request.headers.get('host')
      }
    };
    
    console.log('📊 Diagnostic report:', diagnostics);
    
    return NextResponse.json({
      success: true,
      message: 'Diagnostic information',
      diagnostics,
      recommendations: [
        JWT_SECRET ? null : '❌ JWT_SECRET is not set in environment variables',
        JWT_SECRET && JWT_SECRET.length < 32 ? '⚠️ JWT_SECRET is shorter than recommended (32 chars)' : null,
        allCookies.length === 0 ? '⚠️ No cookies found in request' : null
      ].filter(Boolean)
    });
    
  } catch (error: any) {
    console.error('❌ Diagnostic endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Diagnostic failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// ✅ **OPTIONS method for CORS**
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
