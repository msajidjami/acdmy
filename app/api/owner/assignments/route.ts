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
  studentId: string;
  teacherId: string;
  courseId: string;
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
 * GET
 * ========================================================
 */
export async function GET(
  req: NextRequest
) {
  try {
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

    const academy =
      await Academy.findOne({
        ownerId: user._id,
      }).lean();

    if (!academy) {
      return NextResponse.json(
        {
          error: 'No academy found',
        },
        {
          status: 404,
        }
      );
    }

    const assignments =
      await Assignment.find({
        academyId: academy._id,
      })
        .select(
          [
            'studentId',
            'teacherId',
            'courseId',
            'daysOfWeek',
            'startTime',
            'endTime',
            'status',
            'notes',
            'scheduleKey',

            'zoomMeetingId',
            'zoomMeetingNumber',
            'zoomPassword',
            'zoomLink',
            'zoomStartUrl',
            'zoomHostUserId',
            'zoomTimezone',
            'zoomProvider',
            'zoomUuid',
            'zoomMeetingCreated',

            'createdAt',
            'updatedAt',
          ].join(' ')
        )
        .populate({
          path: 'studentId',
          model: Student,
          select: 'name email',
        })
        .populate({
          path: 'teacherId',
          model: Teacher,
          select:
            'name email subjects',
        })
        .populate({
          path: 'courseId',
          model: Course,
          select: 'title',
        })
        .sort({
          createdAt: -1,
        })
        .limit(500)
        .lean();

    const sanitized =
      assignments.map(
        (assignment: any) => ({
          _id:
            String(assignment._id),

          studentId:
            assignment.studentId
              ? {
                  _id: String(
                    assignment
                      .studentId
                      ._id
                  ),
                  name:
                    assignment
                      .studentId
                      .name || '',
                  email:
                    assignment
                      .studentId
                      .email || '',
                }
              : null,

          teacherId:
            assignment.teacherId
              ? {
                  _id: String(
                    assignment
                      .teacherId
                      ._id
                  ),
                  name:
                    assignment
                      .teacherId
                      .name || '',
                  email:
                    assignment
                      .teacherId
                      .email || '',
                  subjects:
                    Array.isArray(
                      assignment
                        .teacherId
                        .subjects
                    )
                      ? assignment
                          .teacherId
                          .subjects
                      : [],
                }
              : null,

          courseId:
            assignment.courseId
              ? {
                  _id: String(
                    assignment
                      .courseId
                      ._id
                  ),
                  title:
                    assignment
                      .courseId
                      .title || '',
                }
              : null,

          daysOfWeek:
            Array.isArray(
              assignment.daysOfWeek
            )
              ? assignment.daysOfWeek
              : [],

          startTime:
            assignment.startTime || '',

          endTime:
            assignment.endTime || '',

          status:
            assignment.status ||
            'scheduled',

          notes:
            assignment.notes || '',

          zoomMeetingId:
            assignment.zoomMeetingId ||
            '',

          zoomMeetingNumber:
            assignment.zoomMeetingNumber ||
            '',

          zoomPassword:
            assignment.zoomPassword ||
            '',

          zoomLink:
            assignment.zoomLink ||
            '',

          zoomStartUrl:
            assignment.zoomStartUrl ||
            '',

          zoomHostUserId:
            assignment.zoomHostUserId ||
            '',

          zoomTimezone:
            assignment.zoomTimezone ||
            'Asia/Karachi',

          zoomProvider:
            assignment.zoomProvider ||
            'none',

          zoomUuid:
            assignment.zoomUuid || '',

          zoomMeetingCreated:
            Boolean(
              assignment.zoomMeetingCreated
            ),

          scheduleKey:
            assignment.scheduleKey ||
            '',

          createdAt:
            assignment.createdAt,

          updatedAt:
            assignment.updatedAt,
        })
      );

    return NextResponse.json(
      sanitized
    );
  } catch (error) {
    console.error(
      'GET /api/owner/assignments error:',
      error
    );

    return NextResponse.json(
      {
        error: 'Server error',
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ========================================================
 * POST
 * ========================================================
 */
export async function POST(
  req: NextRequest
) {
  try {
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

    const academy =
      await Academy.findOne({
        ownerId: user._id,
      });

    if (!academy) {
      return NextResponse.json(
        {
          error: 'No academy found',
        },
        {
          status: 404,
        }
      );
    }

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
     * Required fields
     */
    if (
      !studentId ||
      !teacherId ||
      !courseId ||
      !Array.isArray(daysOfWeek) ||
      daysOfWeek.length === 0 ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        {
          error:
            'All required fields are required.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ObjectId validation
     */
    if (
      !mongoose.Types.ObjectId.isValid(
        studentId
      ) ||
      !mongoose.Types.ObjectId.isValid(
        teacherId
      ) ||
      !mongoose.Types.ObjectId.isValid(
        courseId
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid student, teacher, or course ID.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Days
     */
    const uniqueDays =
      normalizeDays(daysOfWeek);

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

    /*
     * Time
     */
    const normalizedStartTime =
      String(startTime).trim();

    const normalizedEndTime =
      String(endTime).trim();

    if (
      !/^\d{2}:\d{2}$/.test(
        normalizedStartTime
      ) ||
      !/^\d{2}:\d{2}$/.test(
        normalizedEndTime
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid start or end time.',
        },
        {
          status: 400,
        }
      );
    }

    if (
      normalizedEndTime <=
      normalizedStartTime
    ) {
      return NextResponse.json(
        {
          error:
            'End time must be after start time.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Status
     */
    const normalizedStatus =
      (status ||
        'scheduled') as string;

    if (
      !VALID_STATUSES.includes(
        normalizedStatus as AssignmentStatus
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid assignment status.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Student
     */
    const student =
      await Student.findOne({
        _id: studentId,
        academyId: academy._id,
      }).lean();

    if (!student) {
      return NextResponse.json(
        {
          error:
            'Student not found in your academy.',
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Teacher
     */
    const teacher =
      await Teacher.findOne({
        _id: teacherId,
        academyId: academy._id,
      }).lean();

    if (!teacher) {
      return NextResponse.json(
        {
          error:
            'Teacher not found in your academy.',
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Course
     */
    const course =
      await Course.findOne({
        _id: courseId,
        academyId: academy._id,
      }).lean();

    if (!course) {
      return NextResponse.json(
        {
          error:
            'Course not found in your academy.',
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Zoom normalization
     */
    const normalizedZoomMeetingId =
      zoomMeetingId !== undefined &&
      zoomMeetingId !== null
        ? String(
            zoomMeetingId
          ).trim()
        : '';

    const normalizedZoomMeetingNumber =
      zoomMeetingNumber !== undefined &&
      zoomMeetingNumber !== null
        ? String(
            zoomMeetingNumber
          ).trim()
        : '';

    const normalizedZoomPassword =
      typeof zoomPassword ===
      'string'
        ? zoomPassword.trim()
        : '';

    const normalizedZoomLink =
      typeof zoomLink ===
      'string'
        ? zoomLink.trim()
        : '';

    const normalizedZoomStartUrl =
      typeof zoomStartUrl ===
      'string'
        ? zoomStartUrl.trim()
        : '';

    const normalizedZoomHostUserId =
      zoomHostUserId !== undefined &&
      zoomHostUserId !== null
        ? String(
            zoomHostUserId
          ).trim()
        : '';

    const normalizedZoomTimezone =
      typeof zoomTimezone ===
        'string' &&
      zoomTimezone.trim()
        ? zoomTimezone.trim()
        : 'Asia/Karachi';

    let normalizedZoomProvider =
      typeof zoomProvider ===
        'string' &&
      zoomProvider.trim()
        ? zoomProvider.trim()
        : '';

    if (
      !normalizedZoomProvider
    ) {
      normalizedZoomProvider =
        normalizedZoomMeetingId ||
        normalizedZoomMeetingNumber ||
        normalizedZoomLink ||
        normalizedZoomStartUrl
          ? 'zoom'
          : 'none';
    }

    if (
      !VALID_ZOOM_PROVIDERS.includes(
        normalizedZoomProvider as ZoomProvider
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid Zoom provider.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Schedule Key
     */
    const scheduleKey =
      buildScheduleKey({
        academyId:
          academy._id as mongoose.Types.ObjectId,

        studentId,

        teacherId,

        courseId,

        daysOfWeek:
          uniqueDays,

        startTime:
          normalizedStartTime,

        endTime:
          normalizedEndTime,
      });

    /*
     * Friendly duplicate check
     *
     * MongoDB unique index remains
     * the final protection.
     */
    if (
      normalizedStatus ===
        'scheduled' ||
      normalizedStatus ===
        'ongoing'
    ) {
      const existingAssignment =
        await Assignment.findOne({
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

      if (existingAssignment) {
        return NextResponse.json(
          {
            error:
              'یہ کلاس پہلے ہی اسی طالب علم، استاد اور وقت کے ساتھ موجود ہے۔',
            code:
              'DUPLICATE_ASSIGNMENT',
            assignmentId:
              String(
                existingAssignment._id
              ),
          },
          {
            status: 409,
          }
        );
      }
    }

    /*
     * Create
     */
    const newAssignment =
      await Assignment.create({
        academyId:
          academy._id,

        studentId,

        teacherId,

        courseId,

        daysOfWeek:
          uniqueDays,

        startTime:
          normalizedStartTime,

        endTime:
          normalizedEndTime,

        status:
          normalizedStatus,

        notes:
          typeof notes === 'string'
            ? notes
                .trim()
                .slice(0, 1000)
            : '',

        scheduleKey,

        zoomMeetingId:
          normalizedZoomMeetingId,

        zoomMeetingNumber:
          normalizedZoomMeetingNumber,

        zoomPassword:
          normalizedZoomPassword,

        zoomLink:
          normalizedZoomLink,

        zoomStartUrl:
          normalizedZoomStartUrl,

        zoomHostUserId:
          normalizedZoomHostUserId,

        zoomTimezone:
          normalizedZoomTimezone,

        zoomProvider:
          normalizedZoomProvider,

        zoomUuid:
          zoomUuid !== undefined &&
          zoomUuid !== null
            ? String(
                zoomUuid
              ).trim()
            : '',

        zoomMeetingCreated:
          Boolean(
            zoomMeetingCreated
          ),
      });

    return NextResponse.json(
      {
        success: true,
        assignment:
          newAssignment,
      },
      {
        status: 201,
      }
    );
  } catch (error: unknown) {
    console.error(
      'POST /api/owner/assignments error:',
      error
    );

    const mongoError =
      error as {
        code?: number;
        name?: string;
        message?: string;
      };

    /*
     * Duplicate key
     */
    if (
      mongoError.code === 11000
    ) {
      return NextResponse.json(
        {
          error:
            'یہ کلاس پہلے ہی اسی schedule پر موجود ہے۔ ایک ہی کلاس دوبارہ محفوظ نہیں کی جا سکتی۔',
          code:
            'DUPLICATE_ASSIGNMENT',
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Validation
     */
    if (
      mongoError.name ===
      'ValidationError'
    ) {
      return NextResponse.json(
        {
          error:
            mongoError.message ||
            'Assignment validation failed.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Cast
     */
    if (
      mongoError.name ===
      'CastError'
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid assignment data.',
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
          'Server error.',
      },
      {
        status: 500,
      }
    );
  }
}