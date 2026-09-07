import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

import dbConnect from '@/app/lib/dbConnect';
import ZoomConnection from '@/models/ZoomConnection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();

    const dbName =
      mongoose.connection.db?.databaseName || 'unknown';

    const teacherId =
      '6a980a827328f65851f0de71';

    // تمام ZoomConnection records
    const allConnections =
      await ZoomConnection.find({})
        .select(
          '_id academyId teacherId zoomConnected zoomUserId zoomEmail zoomAccountId zoomTokenExpiresAt zoomScope createdAt updatedAt'
        )
        .lean();

    // مخصوص Teacher کا connection
    const teacherConnection =
      await ZoomConnection.findOne({
        teacherId,
      })
        .select(
          '_id academyId teacherId zoomConnected zoomUserId zoomEmail zoomAccountId zoomTokenExpiresAt zoomScope createdAt updatedAt'
        )
        .lean();

    return NextResponse.json({
      success: true,

      database: dbName,

      teacherId,

      totalZoomConnections:
        allConnections.length,

      teacherConnection,

      allConnections,
    });
  } catch (error) {
    console.error(
      'Debug ZoomConnection error:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      },
      {
        status: 500,
      }
    );
  }
}