
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';

import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import Assignment from '@/models/Assignment';
import Student from '@/models/Student';
import Course from '@/models/Course';

export const dynamic = 'force-dynamic';

const DAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function formatStatus(status) {
  return String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function sortDays(days) {
  return [...new Set(
    days
      .map((day) => String(day || '').trim())
      .filter(Boolean)
  )].sort((a, b) => {
    const indexA = DAY_ORDER.indexOf(a);
    const indexB = DAY_ORDER.indexOf(b);

    if (indexA === -1 && indexB === -1) {
      return a.localeCompare(b);
    }

    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });
}

/*
 * ایک کلاس کی شناخت کے لیے key بنائی جاتی ہے۔
 *
 * اگر:
 * Student + Course + Teacher + Start Time + End Time + Timezone
 * ایک جیسے ہوں تو اسے ایک ہی کلاس سمجھا جائے گا،
 * چاہے database میں اس کے کئی Assignment records ہوں۔
 *
 * دن key کا حصہ نہیں ہیں کیونکہ دن merge کرنے ہیں۔
 */
function getClassKey(assignment) {
  return [
    String(assignment.studentId || ''),
    String(assignment.courseId || ''),
    String(assignment.teacherId || ''),
    String(assignment.startTime || ''),
    String(assignment.endTime || ''),
    String(
      assignment.zoomTimezone ||
      'Asia/Karachi'
    ),
  ].join('|');
}

async function getTeacherSchedule() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  let decoded;

  try {
    decoded = jwt.verify(token, jwtSecret);
  } catch {
    redirect('/login');
  }

  if (!decoded?.userId || !decoded?.email) {
    redirect('/login');
  }

  await connectDB();

  const user = await User.findById(decoded.userId)
    .select('name email role')
    .lean();

  if (!user) {
    redirect('/login');
  }

  const sessionEmail = normalizeEmail(decoded.email);
  const userEmail = normalizeEmail(user.email);

  if (!sessionEmail || sessionEmail !== userEmail) {
    redirect('/login');
  }

  const teacher = await Teacher.findOne({
    email: userEmail,
  })
    .select('_id name email academyId')
    .lean();

  if (!teacher?.academyId) {
    return {
      teacherName: String(
        user.name || 'Teacher'
      ),
      teacherEmail: userEmail,
      rows: [],
    };
  }

  const assignments = await Assignment.find({
    academyId: teacher.academyId,
    teacherId: teacher._id,
    status: { $ne: 'cancelled' },
  })
    .sort({
      startTime: 1,
      createdAt: 1,
    })
    .lean();

  const studentIds = [
    ...new Set(
      assignments
        .map((item) => item.studentId)
        .filter(Boolean)
        .map((id) => String(id))
    ),
  ];

  const courseIds = [
    ...new Set(
      assignments
        .map((item) => item.courseId)
        .filter(Boolean)
        .map((id) => String(id))
    ),
  ];

  const [students, courses] = await Promise.all([
    Student.find({
      _id: { $in: studentIds },
      academyId: teacher.academyId,
    })
      .select('name fatherName')
      .lean(),

    Course.find({
      _id: { $in: courseIds },
      academyId: teacher.academyId,
    })
      .select('name title')
      .lean(),
  ]);

  const studentMap = new Map(
    students.map((student) => [
      String(student._id),
      {
        name: String(
          student.name || 'Student'
        ),
        fatherName: String(
          student.fatherName || ''
        ),
      },
    ])
  );

  const courseMap = new Map(
    courses.map((course) => [
      String(course._id),
      String(
        course.name ||
        course.title ||
        'Course'
      ),
    ])
  );

  /*
   * ==========================================================
   * IMPORTANT:
   *
   * Owner اگر ایک ہی کلاس کے لیے database میں:
   *
   * Assignment 1 → Monday
   * Assignment 2 → Tuesday
   * Assignment 3 → Wednesday
   * Assignment 4 → Thursday
   * Assignment 5 → Friday
   * Assignment 6 → Saturday
   *
   * بناتا ہے تو Teacher کو 6 کلاسیں نہیں دکھائیں گے۔
   *
   * سب کو ایک ہی کلاس میں merge کیا جائے گا:
   *
   * قرآن
   * طالب علم: احمد
   * وقت: 5:00 - 6:00
   * Weekly: Monday Tuesday Wednesday Thursday Friday Saturday
   *
   * ==========================================================
   */

  const mergedClasses = new Map();

  for (const assignment of assignments) {
    const classKey = getClassKey(assignment);

    const student = studentMap.get(
      String(assignment.studentId)
    );

    const courseName =
      courseMap.get(
        String(assignment.courseId)
      ) || 'Course';

    const assignmentDays =
      Array.isArray(assignment.daysOfWeek)
        ? assignment.daysOfWeek
        : [];

    const existing = mergedClasses.get(
      classKey
    );

    if (!existing) {
      mergedClasses.set(classKey, {
        _id: String(assignment._id),

        studentName:
          student?.name || 'Student',

        fatherName:
          student?.fatherName || '',

        courseName,

        daysOfWeek: [
          ...assignmentDays.map((day) =>
            String(day)
          ),
        ],

        startTime: String(
          assignment.startTime || ''
        ),

        endTime: String(
          assignment.endTime || ''
        ),

        status: String(
          assignment.status ||
          'scheduled'
        ),

        notes: String(
          assignment.notes || ''
        ),

        zoomMeetingId: String(
          assignment.zoomMeetingId || ''
        ),

        zoomMeetingNumber: String(
          assignment.zoomMeetingNumber || ''
        ),

        zoomPassword: String(
          assignment.zoomPassword || ''
        ),

        zoomLink: String(
          assignment.zoomLink || ''
        ),

        zoomTimezone: String(
          assignment.zoomTimezone ||
          'Asia/Karachi'
        ),

        zoomProvider: String(
          assignment.zoomProvider || ''
        ),
      });

      continue;
    }

    /*
     * اگر یہی کلاس پہلے سے موجود ہے
     * تو صرف اس کے دن merge کریں۔
     */
    existing.daysOfWeek.push(
      ...assignmentDays.map((day) =>
        String(day)
      )
    );

    /*
     * اگر کسی record میں Zoom موجود ہے
     * اور پہلے والے میں نہیں تھا تو اسے بھی رکھیں۔
     */
    if (
      !existing.zoomMeetingNumber &&
      assignment.zoomMeetingNumber
    ) {
      existing.zoomMeetingId = String(
        assignment.zoomMeetingId || ''
      );

      existing.zoomMeetingNumber =
        String(
          assignment.zoomMeetingNumber || ''
        );

      existing.zoomPassword = String(
        assignment.zoomPassword || ''
      );

      existing.zoomLink = String(
        assignment.zoomLink || ''
      );

      existing.zoomProvider = String(
        assignment.zoomProvider || ''
      );
    }

    /*
     * اگر پہلے والے میں notes نہیں تھے
     * تو دوسرے record کے notes رکھ سکتے ہیں۔
     */
    if (
      !existing.notes &&
      assignment.notes
    ) {
      existing.notes = String(
        assignment.notes
      );
    }

    /*
     * اگر status ongoing ہو تو merged class
     * کو ongoing رکھیں۔
     */
    if (
      assignment.status === 'ongoing'
    ) {
      existing.status = 'ongoing';
    }
  }

  /*
   * Map کو array میں تبدیل کریں
   * اور تمام دنوں کو Monday → Sunday ترتیب میں رکھیں۔
   */
  const rows = Array.from(
    mergedClasses.values()
  ).map((row) => ({
    ...row,
    daysOfWeek: sortDays(
      row.daysOfWeek
    ),
  }));

  /*
   * وقت کے حساب سے classes ترتیب دیں۔
   */
  rows.sort((a, b) => {
    return String(a.startTime).localeCompare(
      String(b.startTime)
    );
  });

  return {
    teacherName: String(
      teacher.name ||
      user.name ||
      'Teacher'
    ),

    teacherEmail: userEmail,

    rows,
  };
}

export default async function TeacherClassesPage() {
  const {
    teacherName,
    teacherEmail,
    rows,
  } = await getTeacherSchedule();

  const scheduledCount = rows.filter(
    (row) =>
      row.status === 'scheduled'
  ).length;

  const ongoingCount = rows.filter(
    (row) =>
      row.status === 'ongoing'
  ).length;

  const zoomCount = rows.filter(
    (row) =>
      Boolean(
        row.zoomMeetingNumber
      )
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">

          <div>
            <p className="text-sm font-medium text-slate-500">
              Teacher Dashboard
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              My Classes
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {teacherName}
              {' · '}
              {teacherEmail}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            <Link
              href="/teacher/schedule"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              My Schedule
            </Link>

            <Link
              href="/teacher/settings"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Zoom Settings
            </Link>

          </div>
        </div>

        {/* Statistics */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Permanent Classes
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {rows.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Scheduled
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {scheduledCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Ongoing
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {ongoingCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Zoom Classes
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {zoomCount}
            </p>
          </div>

        </section>

        {/* Empty State */}
        {rows.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">

            <h2 className="text-lg font-semibold text-slate-900">
              No classes assigned
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your academy owner has not assigned any active classes to you yet.
            </p>

          </div>
        ) : (
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

            {/* Section Header */}
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">

              <h2 className="font-bold text-slate-900">
                My Assigned Classes
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Each class is shown once. All weekly days are combined into the same class.
              </p>

            </div>

            {/* Classes */}
            <div className="divide-y divide-slate-100">

              {rows.map((row) => {
                const hasZoom =
                  Boolean(
                    row.zoomMeetingNumber
                  );

                return (
                  <article
                    key={row._id}
                    className="p-5"
                  >

                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                      {/* Class Information */}
                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="text-lg font-bold text-slate-900">
                            {row.courseName}
                          </h3>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {formatStatus(
                              row.status
                            )}
                          </span>

                        </div>

                        <p className="mt-2 text-sm text-slate-700">
                          Student:{' '}

                          <span className="font-semibold">
                            {row.studentName}
                          </span>

                          {row.fatherName
                            ? ` · ${row.fatherName}`
                            : ''}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {row.startTime ||
                            '--:--'}
                          {' – '}
                          {row.endTime ||
                            '--:--'}
                          {' · '}
                          {row.zoomTimezone ||
                            'Asia/Karachi'}
                        </p>

                        {/* Weekly Days */}
                        {row.daysOfWeek.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">

                            <span className="text-sm font-semibold text-slate-700">
                              Weekly:
                            </span>

                            {row.daysOfWeek.map(
                              (day) => (
                                <span
                                  key={`${row._id}-${day}`}
                                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100"
                                >
                                  {day}
                                </span>
                              )
                            )}

                          </div>
                        )}

                        {row.notes && (
                          <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm text-slate-600">
                            {row.notes}
                          </p>
                        )}

                      </div>

                      {/* Buttons */}
                      <div className="flex shrink-0 flex-wrap gap-2">

                        {hasZoom ? (
                          <Link
                            href={`/teacher/classroom/${row._id}`}
                            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                          >
                            Open Classroom
                          </Link>
                        ) : (
                          <span className="inline-flex items-center rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">
                            Zoom not configured
                          </span>
                        )}

                        {row.zoomLink && (
                          <a
                            href={row.zoomLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Join in Zoom
                          </a>
                        )}

                      </div>

                    </div>

                    {/* Zoom Details */}
                    {hasZoom && (
                      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">

                        Meeting ID:{' '}

                        <span className="font-semibold text-slate-700">
                          {row.zoomMeetingNumber}
                        </span>

                        {row.zoomProvider && (
                          <>
                            {' · '}

                            Provider:{' '}

                            <span className="font-semibold text-slate-700">
                              {row.zoomProvider}
                            </span>
                          </>
                        )}

                      </div>
                    )}

                  </article>
                );
              })}

            </div>

          </section>
        )}

      </div>
    </main>
  );
}

