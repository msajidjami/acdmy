// app/api/admin/owner/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Owner from '@/models/Teacher';
import jwt from 'jsonwebtoken';

// ✅ بالکل وہی verifyAdminAccess فنکشن جو /api/admission میں ہے
async function verifyAdminAccess(request: NextRequest) {
  try {
    // Method 1: Bearer token سے ADMIN_SECRET_KEY چیک کریں
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET_KEY;
    
    if (authHeader && adminSecret && authHeader === `Bearer ${adminSecret}`) {
      return { isAdmin: true, userRole: 'admin', userId: 'system' };
    }

    // Method 2: JWT token سے چیک کریں (cookies میں token)
    const token = request.cookies.get('token')?.value || 
                  request.cookies.get('auth_token')?.value;

    if (token) {
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        console.error('JWT_SECRET missing');
        return { isAdmin: false };
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const adminRoles = [
          'admin', 'owner', 'super-admin',
          'education-admin', 'darul-ifta-admin',
          'section1-admin', 'section2-admin'
        ];

        if (decoded.role && adminRoles.includes(decoded.role)) {
          return {
            isAdmin: true,
            userRole: decoded.role,
            userId: decoded.userId || decoded.id || 'unknown'
          };
        }
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError);
        // ڈیولپمنٹ میں decode کی اجازت نہیں دی، سیکیورٹی کے لیے
        return { isAdmin: false };
      }
    }

    return { isAdmin: false };
  } catch (error) {
    console.error('Admin verification error:', error);
    return { isAdmin: false };
  }
}

// ✅ POST: نیا اونر شامل کریں
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const auth = await verifyAdminAccess(request);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Admin privileges required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, contactNumber } = body;

    if (!name || !email || !contactNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // اونر بنائیں (ماڈل میں pre-save سے referralCode آٹو جنریٹ ہو جائے گا)
    const owner = await Owner.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      contactNumber: contactNumber.trim(),
    });

    const siteUrl = process.env.SITE_URL || 'https://yourdomain.com';
    const referralLink = `${siteUrl}/admission?ref=${owner.referralCode}`;

    return NextResponse.json({
      success: true,
      message: 'اونر کامیابی سے شامل ہو گیا',
      data: owner,
      referralLink
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating owner:', error);

    if (error.code === 11000) { // Duplicate key error (email یا referralCode)
      return NextResponse.json(
        { success: false, error: 'Duplicate entry', message: 'ای میل پہلے سے موجود ہے' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Server error', message: 'اونر شامل نہیں ہو سکا' },
      { status: 500 }
    );
  }
}

// ✅ GET: تمام اونرز حاصل کریں
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const auth = await verifyAdminAccess(request);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Admin privileges required' },
        { status: 401 }
      );
    }

    const owners = await Owner.find({})
      .select('name email contactNumber referralCode createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const siteUrl = process.env.SITE_URL || 'https://yourdomain.com';

    // ہر اونر کے لیے ریفرل لنک شامل کریں
    const ownersWithLinks = owners.map(owner => ({
      ...owner,
      referralLink: `${siteUrl}/admission?ref=${owner.referralCode}`
    }));

    return NextResponse.json({
      success: true,
      data: ownersWithLinks,
      count: owners.length
    });

  } catch (error: any) {
    console.error('Error fetching owners:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}