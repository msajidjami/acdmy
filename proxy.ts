import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// عوامی راستے (انہیں سب دیکھ سکتے ہیں)
const publicPaths = ['/', '/login', '/signup'];

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  // ✅ اگر صارف لاگ ان ہے اور /login یا /signup پر جا رہا ہے تو ڈیش بورڈ پر بھیجیں
  if (token && (path === '/login' || path === '/signup')) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const role = decoded.role;
      
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (role === 'owner') {
        return NextResponse.redirect(new URL('/owner/dashboard', request.url));
      } else if (role === 'teacher') {
        return NextResponse.redirect(new URL('/teacher/dashboard', request.url));
      } else if (role === 'student') {
        return NextResponse.redirect(new URL('/student/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch {
      // اگر ٹوکن غلط ہے تو کوکی صاف کریں اور لاگ ان پر بھیجیں
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  // ✅ اگر صارف لاگ ان نہیں ہے اور محفوظ راستے پر جا رہا ہے تو لاگ ان پر بھیجیں
  if (!token) {
    // عوامی راستوں کی اجازت
    if (publicPaths.some(p => path === p)) {
      return NextResponse.next();
    }
    
    // اگر یہ API راستہ ہے تو اجازت دیں
    if (path.startsWith('/api')) {
      return NextResponse.next();
    }
    
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ✅ ٹوکن کو ڈی کوڈ کریں اور کردار کی بنیاد پر رسائی دیں (صرف /admin اور /owner کے لیے)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const role = decoded.role;

    // Admin کو Owner کے ڈیش بورڈ تک رسائی دیں
    if (path.startsWith('/owner') && role !== 'owner' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Admin ڈیش بورڈ صرف Admin کے لیے
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // ✅ /teacher اور /student کے لیے کوئی رول چیک نہیں – ہر لاگ ان صارف کو اجازت ہے
    // (صفحہ خود چیک کرے گا کہ صارف کا پروفائل موجود ہے یا نہیں)

    return NextResponse.next();
  } catch (error) {
    // غلط ٹوکن
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

// ✅ Matcher – بغیر کسی تبدیلی کے ویسے ہی رکھیں
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.svg|.*\\.ico|.*\\.jpg|.*\\.jpeg|.*\\.webp).*)',
  ],
};