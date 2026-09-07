import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import connectDB from '@/app/lib/dbConnect';

import Assignment from '@/models/Assignment';
import Academy from '@/models/Academy';
import User from '@/models/User';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Course from '@/models/Course';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

const VALID_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const VALID_STATUSES = [
  'scheduled',
  'ongoing',
  'completed',
  'cancelled',
] as const;

const VALID_ZOOM_PROVIDERS = [
  'zoom',
  'none',
] as const;

type JwtPayload = {
  userId?: string;
};

type AssignmentStatus =
  (typeof VALID_STATUSES)[number];

type ZoomProvider =
  (typeof VALID_ZOOM_PROVIDERS)[number];

type RequestBody = {
  studentId?: string;
  teacherId?: string;
  courseId?: string;
  daysOfWeek?: unknown[];
  startTime?: string;
  endTime?: string;
  status?: string;
  notes?: string;

  zoomMeetingId?: string | number | null;
  zoomMeetingNumber?: string | number | null;
  zoomPassword?: string | null;
  zoomLink?: string | null;
  zoomStartUrl?: string | null;
  zoomHostUserId?: string | number | null;
  zoomTimezone?: string | null;
  zoomProvider?: string | null;
  zoomUuid?: string | null;
  zoomMeetingCreated?: boolean;
};

function getJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error(
      'JWT_SECRET is not configured'
    );
  }

  return JWT_SECRET;
}

async function getUserFromRequest(
  req: NextRequest
) {
  const token =
    req.cookies.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded =
      jwt.verify(
        token,
        getJwtSecret()
      ) as JwtPayload;

    if (!decoded?.userId) {
      return null;
    }

    await connectDB();

    return await User.findById(
      decoded.userId
    )
      .select('-password')
      .lean();
  } catch (error) {
    console.error(
      'getUserFromRequest error:',
      error
    );

    return null;
  }
}

function normalizeDays(
  daysOfWeek: unknown[]
): string[] {
  return [
    ...new Set(
      daysOfWeek
        .map((day: unknown) =>
          String(day).trim()
        )
        .filter(
          (day: string) =>
            Boolean(day)
        )
    ),
  ];
}

function buildScheduleKey({
  academyId,
  studentId,
  teacherId,
  courseId,
  daysOfWeek,
  startTime,
  endTime,
}: {
  academyId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
}): string {
  const sortedDays =
    [...daysOfWeek].sort();

  return [
    String(academyId),
    String(studentId),
    String(teacherId),
    String(courseId),
    sortedDays.join('-'),
    startTime.trim(),
    endTime.trim(),
  ].join('_');
}

/*
 * ========================================================
 * PUT
 * ========================================================
 */
export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    /*
     * Authentication
     */
    const user =
      await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      );
    }

    await connectDB();

    /*
     * Owner academy
     */
    const academy =
      await Academy.findOne({
        ownerId: user._id,
      });

    if (!academy) {
      return NextResponse.json(
        {
          error:
            'No academy found',
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Assignment ID
     */
    const { id } =
      await params;

    if (!id) {
      return NextResponse.json(
        {
          error:
            'Assignment ID is required',
        },
        {
          status: 400,
        }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid assignment ID',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Find assignment
     */
    const assignment =
      await Assignment.findOne({
        _id: id,
        academyId:
          academy._id,
      });

    if (!assignment) {
      return NextResponse.json(
        {
          error:
            'Assignment not found',
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Body
     */
    const body =
      (await req.json()) as RequestBody;

    const {
      studentId,
      teacherId,
      courseId,
      daysOfWeek,
      startTime,
      endTime,
      status,
      notes,

      zoomMeetingId,
      zoomMeetingNumber,
      zoomPassword,
      zoomLink,
      zoomStartUrl,
      zoomHostUserId,
      zoomTimezone,
      zoomProvider,
      zoomUuid,
      zoomMeetingCreated,
    } = body;

    /*
     * Student
     */
    if (
      studentId !== undefined
    ) {
      if (
        !studentId ||
        !mongoose.Types.ObjectId.isValid(
          studentId
        )
      ) {
        return NextResponse.json(
          {
            error:
              'Invalid student ID',
          },
          {
            status: 400,
          }
        );
      }

      const student =
        await Student.findOne({
          _id: studentId,
          academyId:
            academy._id,
        }).lean();

      if (!student) {
        return NextResponse.json(
          {
            error:
              'Student not found in your academy',
          },
          {
            status: 404,
          }
        );
      }

      assignment.studentId =
        new mongoose.Types.ObjectId(
          studentId
        );
    }

    /*
     * Teacher
     */
    if (
      teacherId !== undefined
    ) {
      if (
        !teacherId ||
        !mongoose.Types.ObjectId.isValid(
          teacherId
        )
      ) {
        return NextResponse.json(
          {
            error:
              'Invalid teacher ID',
          },
          {
            status: 400,
          }
        );
      }

      const teacher =
        await Teacher.findOne({
          _id: teacherId,
          academyId:
            academy._id,
        }).lean();

      if (!teacher) {
        return NextResponse.json(
          {
            error:
              'Teacher not found in your academy',
          },
          {
            status: 404,
          }
        );
      }

      assignment.teacherId =
        new mongoose.Types.ObjectId(
          teacherId
        );
    }

    /*
     * Course
     */
    if (
      courseId !== undefined
    ) {
      if (
        !courseId ||
        !mongoose.Types.ObjectId.isValid(
          courseId
        )
      ) {
        return NextResponse.json(
          {
            error:
              'Invalid course ID',
          },
          {
            status: 400,
          }
        );
      }

      const course =
        await Course.findOne({
          _id: courseId,
          academyId:
            academy._id,
        }).lean();

      if (!course) {
        return NextResponse.json(
          {
            error:
              'Course not found in your academy',
          },
          {
            status: 404,
          }
        );
      }

      assignment.courseId =
        new mongoose.Types.ObjectId(
          courseId
        );
    }

    /*
     * Days
     */
    if (
      daysOfWeek !== undefined
    ) {
      if (
        !Array.isArray(
          daysOfWeek
        ) ||
        daysOfWeek.length === 0
      ) {
        return NextResponse.json(
          {
            error:
              'At least one day must be selected',
          },
          {
            status: 400,
          }
        );
      }

      const uniqueDays =
        normalizeDays(
          daysOfWeek
        );

      const invalidDays =
        uniqueDays.filter(
          (
            day: string
          ) =>
            !VALID_DAYS.includes(
              day as
                (typeof VALID_DAYS)[number]
            )
        );

      if (
        invalidDays.length > 0
      ) {
        return NextResponse.json(
          {
            error:
              `Invalid day(s): ${invalidDays.join(', ')}`,
          },
          {
            status: 400,
          }
        );
      }

      assignment.daysOfWeek =
        uniqueDays;
    }

    /*
     * Start time
     */
    if (
      startTime !== undefined
    ) {
      const value =
        String(startTime).trim();

      if (
        !/^\d{2}:\d{2}$/.test(
          value
        )
      ) {
        return NextResponse.json(
          {
            error:
              'Invalid start time',
          },
          {
            status: 400,
          }
        );
      }

      assignment.startTime =
        value;
    }

    /*
     * End time
     */
    if (
      endTime !== undefined
    ) {
      const value =
        String(endTime).trim();

      if (
        !/^\d{2}:\d{2}$/.test(
          value
        )
      ) {
        return NextResponse.json(
          {
            error:
              'Invalid end time',
          },
          {
            status: 400,
          }
        );
      }

      assignment.endTime =
        value;
    }

    /*
     * Final time validation
     */
    if (
      assignment.endTime <=
      assignment.startTime
    ) {
      return NextResponse.json(
        {
          error:
            'End time must be after start time',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Status
     */
    if (
      status !== undefined
    ) {
      if (
        !VALID_STATUSES.includes(
          status as AssignmentStatus
        )
      ) {
        return NextResponse.json(
          {
            error:
              'Invalid assignment status',
          },
          {
            status: 400,
          }
        );
      }

      assignment.status =
        status as AssignmentStatus;
    }

    /*
     * Notes
     */
    if (
      notes !== undefined
    ) {
      assignment.notes =
        typeof notes === 'string'
          ? notes
              .trim()
              .slice(0, 1000)
          : '';
    }

    /*
     * Zoom Meeting ID
     */
    if (
      zoomMeetingId !== undefined
    ) {
      assignment.zoomMeetingId =
        zoomMeetingId !== null &&
        zoomMeetingId !== ''
          ? String(
              zoomMeetingId
            ).trim()
          : '';
    }

    /*
     * Zoom Meeting Number
     */
    if (
      zoomMeetingNumber !==
      undefined
    ) {
      assignment.zoomMeetingNumber =
        zoomMeetingNumber !== null &&
        zoomMeetingNumber !== ''
          ? String(
              zoomMeetingNumber
            ).trim()
          : '';
    }

    /*
     * Zoom Password
     */
    if (
      zoomPassword !== undefined
    ) {
      assignment.zoomPassword =
        typeof zoomPassword ===
        'string'
          ? zoomPassword.trim()
          : '';
    }

    /*
     * Zoom Join URL
     */
    if (
      zoomLink !== undefined
    ) {
      assignment.zoomLink =
        typeof zoomLink ===
        'string'
          ? zoomLink.trim()
          : '';
    }

    /*
     * Zoom Host Start URL
     */
    if (
      zoomStartUrl !== undefined
    ) {
      assignment.zoomStartUrl =
        typeof zoomStartUrl ===
        'string'
          ? zoomStartUrl.trim()
          : '';
    }

    /*
     * Zoom Host User ID
     */
    if (
      zoomHostUserId !==
      undefined
    ) {
      assignment.zoomHostUserId =
        zoomHostUserId !== null &&
        zoomHostUserId !== ''
          ? String(
              zoomHostUserId
            ).trim()
          : '';
    }

    /*
     * Zoom timezone
     */
    if (
      zoomTimezone !== undefined
    ) {
      assignment.zoomTimezone =
        typeof zoomTimezone ===
          'string' &&
        zoomTimezone.trim()
          ? zoomTimezone.trim()
          : 'Asia/Karachi';
    }

    /*
     * Zoom provider
     */
    if (
      zoomProvider !== undefined
    ) {
      const normalizedProvider =
        typeof zoomProvider ===
        'string'
          ? zoomProvider.trim()
          : '';

      if (
        normalizedProvider &&
        !VALID_ZOOM_PROVIDERS.includes(
          normalizedProvider as ZoomProvider
        )
      ) {
        return NextResponse.json(
          {
            error:
              'Invalid Zoom provider',
          },
          {
            status: 400,
          }
        );
      }

      assignment.zoomProvider =
        (
          normalizedProvider ||
          (
            assignment.zoomMeetingId ||
            assignment.zoomMeetingNumber ||
            assignment.zoomLink ||
            assignment.zoomStartUrl
              ? 'zoom'
              : 'none'
          )
        ) as ZoomProvider;
    }

    /*
     * Zoom UUID
     */
    if (
      zoomUuid !== undefined
    ) {
      assignment.zoomUuid =
        zoomUuid !== null
          ? String(
              zoomUuid
            ).trim()
          : '';
    }

    /*
     * Zoom meeting created
     */
    if (
      zoomMeetingCreated !==
      undefined
    ) {
      assignment.zoomMeetingCreated =
        Boolean(
          zoomMeetingCreated
        );
    }

    /*
     * Final days
     */
    const finalDays =
      Array.isArray(
        assignment.daysOfWeek
      )
        ? normalizeDays(
            assignment.daysOfWeek
          )
        : [];

    if (
      finalDays.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'At least one day must be selected',
        },
        {
          status: 400,
        }
      );
    }

    assignment.daysOfWeek =
      finalDays;

    /*
     * Build new schedule key
     */
    const scheduleKey =
      buildScheduleKey({
        academyId:
          academy._id as mongoose.Types.ObjectId,

        studentId:
          assignment.studentId as mongoose.Types.ObjectId,

        teacherId:
          assignment.teacherId as mongoose.Types.ObjectId,

        courseId:
          assignment.courseId as mongoose.Types.ObjectId,

        daysOfWeek:
          finalDays,

        startTime:
          assignment.startTime,

        endTime:
          assignment.endTime,
      });

    assignment.scheduleKey =
      scheduleKey;

    /*
     * Duplicate check
     *
     * Exclude current assignment.
     */
    if (
      assignment.status ===
        'scheduled' ||
      assignment.status ===
        'ongoing'
    ) {
      const duplicate =
        await Assignment.findOne({
          _id: {
            $ne: assignment._id,
          },

          academyId:
            academy._id,

          scheduleKey,

          status: {
            $in: [
              'scheduled',
              'ongoing',
            ],
          },
        })
          .select('_id')
          .lean();

      if (duplicate) {
        return NextResponse.json(
          {
            error:
              'یہ schedule پہلے ہی کسی دوسری assignment میں موجود ہے۔',
            code:
              'DUPLICATE_ASSIGNMENT',
            assignmentId:
              String(
                duplicate._id
              ),
          },
          {
            status: 409,
          }
        );
      }
    }

    /*
     * Save
     */
    await assignment.save();

    return NextResponse.json({
      success: true,
      assignment,
    });
  } catch (error: unknown) {
    console.error(
      'PUT /api/owner/assignments/[id] error:',
      error
    );

    const mongoError =
      error as {
        code?: number;
        name?: string;
        message?: string;
      };

    /*
     * Duplicate
     */
    if (
      mongoError.code === 11000
    ) {
      return NextResponse.json(
        {
          error:
            'یہ کلاس پہلے ہی اسی schedule پر موجود ہے۔',
          code:
            'DUPLICATE_ASSIGNMENT',
        },
        {
          status: 409,
        }
      );
    }

    /*
     * CastError
     */
    if (
      mongoError.name ===
      'CastError'
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid assignment, student, teacher, or course ID',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ValidationError
     */
    if (
      mongoError.name ===
      'ValidationError'
    ) {
      return NextResponse.json(
        {
          error:
            mongoError.message ||
            'Assignment validation failed',
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          mongoError.message ||
          'Server error',
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ========================================================
 * DELETE
 * ========================================================
 */
export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    /*
     * Authentication
     */
    const user =
      await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      );
    }

    await connectDB();

    /*
     * Owner academy
     */
    const academy =
      await Academy.findOne({
        ownerId: user._id,
      });

    if (!academy) {
      return NextResponse.json(
        {
          error:
            'No academy found',
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Assignment ID
     */
    const { id } =
      await params;

    if (!id) {
      return NextResponse.json(
        {
          error:
            'Assignment ID is required',
        },
        {
          status: 400,
        }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid assignment ID',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Delete only from owner's academy
     */
    const assignment =
      await Assignment.findOneAndDelete(
        {
          _id: id,
          academyId:
            academy._id,
        }
      );

    if (!assignment) {
      return NextResponse.json(
        {
          error:
            'Assignment not found',
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,

      message:
        'Assignment deleted successfully',
    });
  } catch (error: unknown) {
    console.error(
      'DELETE /api/owner/assignments/[id] error:',
      error
    );

    const mongoError =
      error as {
        name?: string;
        message?: string;
      };

    if (
      mongoError.name ===
      'CastError'
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid assignment ID',
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          mongoError.message ||
          'Server error',
      },
      {
        status: 500,
      }
    );
  }
}