import mongoose, {
  Schema,
  models,
  model,
  type Document,
} from 'mongoose';

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

type AssignmentStatus =
  (typeof VALID_STATUSES)[number];

type ZoomProvider =
  (typeof VALID_ZOOM_PROVIDERS)[number];

interface AssignmentDocument
  extends Document {
  academyId?: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;

  daysOfWeek?: string[];

  startTime?: string;
  endTime?: string;

  status?: AssignmentStatus;
  notes?: string;

  scheduleKey?: string;

  zoomProvider?: ZoomProvider;
  zoomMeetingId?: string;
  zoomMeetingNumber?: string;
  zoomLink?: string;
  zoomStartUrl?: string;
  zoomPassword?: string;
  zoomHostUserId?: string;
  zoomTimezone?: string;
  zoomUuid?: string;
  zoomMeetingCreated?: boolean;
}

/*
 * ========================================================
 * Build Schedule Key
 * ========================================================
 *
 * Example:
 *
 * academy_student_teacher_course_Monday-Wednesday_19:00_20:00
 *
 * The days are sorted so that:
 *
 * Monday, Wednesday, Friday
 *
 * and
 *
 * Friday, Monday, Wednesday
 *
 * produce the same schedule key.
 */
function buildScheduleKey(
  doc: Partial<AssignmentDocument>
): string {
  const academyId = doc.academyId
    ? String(doc.academyId)
    : '';

  const studentId = doc.studentId
    ? String(doc.studentId)
    : '';

  const teacherId = doc.teacherId
    ? String(doc.teacherId)
    : '';

  const courseId = doc.courseId
    ? String(doc.courseId)
    : '';

  const days: string[] =
    Array.isArray(doc.daysOfWeek)
      ? [
          ...new Set(
            doc.daysOfWeek
              .map(
                (day: string) =>
                  String(day).trim()
              )
              .filter(
                (day: string) =>
                  Boolean(day)
              )
          ),
        ].sort()
      : [];

  const startTime =
    doc.startTime
      ? String(
          doc.startTime
        ).trim()
      : '';

  const endTime =
    doc.endTime
      ? String(
          doc.endTime
        ).trim()
      : '';

  return [
    academyId,
    studentId,
    teacherId,
    courseId,
    days.join('-'),
    startTime,
    endTime,
  ].join('_');
}

const AssignmentSchema =
  new Schema<AssignmentDocument>(
    {
      /*
       * ========================================================
       * Academy
       * ========================================================
       */
      academyId: {
        type: Schema.Types.ObjectId,
        ref: 'Academy',
        required: true,
        index: true,
      },

      /*
       * ========================================================
       * Student
       * ========================================================
       */
      studentId: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true,
      },

      /*
       * ========================================================
       * Teacher
       * ========================================================
       */
      teacherId: {
        type: Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true,
        index: true,
      },

      /*
       * ========================================================
       * Course
       * ========================================================
       */
      courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true,
      },

      /*
       * ========================================================
       * Weekly Schedule
       * ========================================================
       */
      daysOfWeek: {
        type: [String],
        required: true,
        default: [],
      },

      /*
       * ========================================================
       * Start Time
       * ========================================================
       */
      startTime: {
        type: String,
        required: true,
        trim: true,
      },

      /*
       * ========================================================
       * End Time
       * ========================================================
       */
      endTime: {
        type: String,
        required: true,
        trim: true,
      },

      /*
       * ========================================================
       * Assignment Status
       * ========================================================
       */
      status: {
        type: String,
        enum: VALID_STATUSES,
        default: 'scheduled',
        index: true,
      },

      /*
       * ========================================================
       * Notes
       * ========================================================
       */
      notes: {
        type: String,
        default: '',
        trim: true,
      },

      /*
       * ========================================================
       * Unique Schedule Key
       * ========================================================
       *
       * This is generated automatically.
       */
      scheduleKey: {
        type: String,
        required: true,
        index: true,
      },

      /*
       * ========================================================
       * ZOOM
       * ========================================================
       */

      /*
       * Zoom Provider
       */
      zoomProvider: {
        type: String,
        enum: VALID_ZOOM_PROVIDERS,
        default: 'none',
      },

      /*
       * Zoom Meeting ID
       */
      zoomMeetingId: {
        type: String,
        default: '',
        trim: true,
        index: true,
      },

      /*
       * Zoom Meeting Number
       */
      zoomMeetingNumber: {
        type: String,
        default: '',
        trim: true,
      },

      /*
       * Student / Participant Join URL
       */
      zoomLink: {
        type: String,
        default: '',
        trim: true,
      },

      /*
       * Teacher / Host Start URL
       */
      zoomStartUrl: {
        type: String,
        default: '',
        trim: true,
      },

      /*
       * Zoom Password
       */
      zoomPassword: {
        type: String,
        default: '',
        trim: true,
      },

      /*
       * Zoom Host User ID
       */
      zoomHostUserId: {
        type: String,
        default: '',
        trim: true,
      },

      /*
       * Zoom Timezone
       */
      zoomTimezone: {
        type: String,
        default: 'Asia/Karachi',
        trim: true,
      },

      /*
       * Zoom UUID
       */
      zoomUuid: {
        type: String,
        default: '',
        trim: true,
      },

      /*
       * Whether permanent Zoom meeting
       * has already been created.
       */
      zoomMeetingCreated: {
        type: Boolean,
        default: false,
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

/*
 * ========================================================
 * Fast Lookup
 * Academy → Teacher
 * ========================================================
 */
AssignmentSchema.index({
  academyId: 1,
  teacherId: 1,
});

/*
 * ========================================================
 * Fast Lookup
 * Academy → Student
 * ========================================================
 */
AssignmentSchema.index({
  academyId: 1,
  studentId: 1,
});

/*
 * ========================================================
 * Fast Lookup
 * Academy → Course
 * ========================================================
 */
AssignmentSchema.index({
  academyId: 1,
  courseId: 1,
});

/*
 * ========================================================
 * UNIQUE ACTIVE ASSIGNMENT
 * ========================================================
 *
 * scheduled duplicate → BLOCKED
 * ongoing duplicate   → BLOCKED
 *
 * completed duplicate → ALLOWED
 * cancelled duplicate → ALLOWED
 */
AssignmentSchema.index(
  {
    scheduleKey: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      status: {
        $in: [
          'scheduled',
          'ongoing',
        ],
      },
    },

    name:
      'unique_active_assignment_schedule',
  }
);

/*
 * ========================================================
 * Automatically Generate Schedule Key
 * ========================================================
 *
 * IMPORTANT:
 *
 * We intentionally do NOT use `next` here.
 * Mongoose supports synchronous validate middleware,
 * which avoids the TypeScript overload problem.
 */
AssignmentSchema.pre(
  'validate',
  function (this: AssignmentDocument) {
    this.scheduleKey =
      buildScheduleKey(this);
  }
);

/*
 * ========================================================
 * Model
 * ========================================================
 */
const Assignment =
  models.Assignment ||
  model<AssignmentDocument>(
    'Assignment',
    AssignmentSchema
  );

export default Assignment;