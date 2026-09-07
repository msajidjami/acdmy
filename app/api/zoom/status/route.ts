
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';
import ZoomConnection from '@/models/ZoomConnection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ======================================================
// GET /api/zoom/status
// ======================================================

export async function GET(
  request: NextRequest
) {
  try {
    // ==================================================
    // 1. Connect MongoDB
    // ==================================================

    await connectDB();

    // ==================================================
    // 2. Get login token
    // ==================================================

    const token =
      request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      );
    }

    // ==================================================
    // 3. JWT Secret
    // ==================================================

    const jwtSecret =
      process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET is not configured'
      );
    }

    // ==================================================
    // 4. Verify login JWT
    // ==================================================

    let decoded: {
      userId?: string;
      email?: string;
      role?: string;
    };

    try {
      decoded = jwt.verify(
        token,
        jwtSecret
      ) as {
        userId?: string;
        email?: string;
        role?: string;
      };
    } catch (error) {
      console.error(
        'Zoom status JWT error:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          connected: false,
          error:
            'Invalid or expired session',
        },
        {
          status: 401,
        }
      );
    }

    // ==================================================
    // 5. Validate email
    // ==================================================

    const email =
      decoded?.email
        ?.trim()
        .toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          error:
            'Invalid session: email missing',
        },
        {
          status: 401,
        }
      );
    }

    // ==================================================
    // 6. Find teacher
    // ==================================================

    const teacher =
      await Teacher.findOne({
        email,
      }).select(
        '_id academyId name email'
      );

    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          error:
            'Teacher record not found',
        },
        {
          status: 404,
        }
      );
    }

    // ==================================================
    // 7. Find Zoom connection
    // ==================================================

    const connection =
      await ZoomConnection.findOne({
        academyId:
          teacher.academyId,

        teacherId:
          teacher._id,
      }).lean();

    // ==================================================
    // 8. No Zoom connection
    // ==================================================

    if (!connection) {
      return NextResponse.json({
        success: true,

        connected: false,

        zoom: null,
      });
    }

    // ==================================================
    // 9. Check access token expiry
    // ==================================================

    const expiresAt =
      connection.zoomTokenExpiresAt
        ? new Date(
            connection.zoomTokenExpiresAt
          ).getTime()
        : 0;

    const tokenExpired =
      !expiresAt ||
      expiresAt <= Date.now();

    // ==================================================
    // 10. Safe response
    // ==================================================

    return NextResponse.json({
      success: true,

      connected:
        Boolean(
          connection.zoomConnected
        ),

      zoom: {
        connected:
          Boolean(
            connection.zoomConnected
          ),

        userId:
          connection.zoomUserId ||
          '',

        accountId:
          connection.zoomAccountId ||
          '',

        email:
          connection.zoomEmail ||
          '',

        tokenExpired,

        connectedAt:
          connection.createdAt ||
          null,

        updatedAt:
          connection.updatedAt ||
          null,
      },
    });
  } catch (error: unknown) {
    console.error(
      'Zoom status error:',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Zoom status حاصل نہیں ہو سکا';

    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}

