import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt, { JwtPayload } from 'jsonwebtoken';
import Link from 'next/link';

import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';
import Academy from '@/models/Academy';
import ZoomConnection from '@/models/ZoomConnection';

import {
  Settings,
  User,
  Mail,
  School,
  Video,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// ======================================================
// Types
// ======================================================

type JwtUserPayload = JwtPayload & {
  userId?: string;
  email?: string;
};

type TeacherData = {
  teacher: any;
  academy: any;
  zoomConnection: any | null;
};

// ======================================================
// Helpers
// ======================================================

function normalizeEmail(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase();
}

// ======================================================
// Get Teacher + Zoom Data
// ======================================================

async function getTeacherData(
  email: string
): Promise<TeacherData | null> {
  await connectDB();

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  const teacher = await Teacher.findOne({
    email: normalizedEmail,
  })
    .select(
      '_id academyId name email phone subjects bio isAvailable'
    )
    .lean();

  if (!teacher) {
    return null;
  }

  const academy = teacher.academyId
    ? await Academy.findById(
        teacher.academyId
      )
        .select('_id name')
        .lean()
    : null;

  // ====================================================
  // IMPORTANT:
  // zoomAccessToken اور zoomRefreshToken select: false
  // ہیں، اس لیے وہ یہاں frontend تک نہیں جائیں گے۔
  // ====================================================

  const zoomConnection =
    await ZoomConnection.findOne({
      academyId: teacher.academyId,
      teacherId: teacher._id,
      zoomConnected: true,
    })
      .select(
        '_id zoomConnected zoomUserId zoomAccountId zoomEmail zoomTokenExpiresAt zoomScope createdAt updatedAt'
      )
      .lean();

  return {
    teacher,
    academy,
    zoomConnection,
  };
}

// ======================================================
// Teacher Settings Page
// ======================================================

export default async function TeacherSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    zoom?: string;
    message?: string;
  }>;
}) {
  // ====================================================
  // 1. Login check
  // ====================================================

  const cookieStore = await cookies();

  const token =
    cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  // ====================================================
  // 2. JWT Secret
  // ====================================================

  const jwtSecret =
    process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      'JWT_SECRET is not configured'
    );
  }

  // ====================================================
  // 3. Verify JWT
  // ====================================================

  let decoded: JwtUserPayload;

  try {
    const result = jwt.verify(
      token,
      jwtSecret
    );

    if (typeof result === 'string') {
      redirect('/login');
    }

    decoded =
      result as JwtUserPayload;
  } catch {
    redirect('/login');
  }

  // ====================================================
  // 4. Get email
  // ====================================================

  const userEmail =
    normalizeEmail(decoded.email);

  if (!userEmail) {
    redirect('/login');
  }

  // ====================================================
  // 5. Load Teacher
  // ====================================================

  const data =
    await getTeacherData(
      userEmail
    );

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-red-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Teacher Profile Not Found
          </h1>

          <p className="mt-2 text-gray-500">
            آپ کا Teacher profile database میں موجود نہیں ہے۔
          </p>

          <Link
            href="/teacher/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const {
    teacher,
    academy,
    zoomConnection,
  } = data;

  // ====================================================
  // 6. URL messages
  // ====================================================

  const params =
    await searchParams;

  const zoomStatus =
    String(params?.zoom || '').trim();

  const zoomMessage =
    String(params?.message || '').trim();

  const isZoomConnected =
    Boolean(
      zoomConnection?.zoomConnected
    );

  // ====================================================
  // 7. Render
  // ====================================================

  return (
    <div className="mx-auto max-w-5xl pb-10">

      {/* ============================================================ */}
      {/* Header                                                        */}
      {/* ============================================================ */}

      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
              <Settings className="h-6 w-6 text-indigo-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900">
              Teacher Settings
            </h1>
          </div>

          <p className="text-gray-500">
            Manage your account and Zoom classroom connection.
          </p>
        </div>

        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

      </div>

      {/* ============================================================ */}
      {/* Zoom callback success                                         */}
      {/* ============================================================ */}

      {zoomStatus === 'connected' && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800">

          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />

          <div>
            <h2 className="font-bold">
              Zoom Successfully Connected
            </h2>

            <p className="mt-1 text-sm text-green-700">
              آپ کا Zoom account کامیابی سے Teacher account کے ساتھ connect ہو گیا ہے۔
            </p>
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* Zoom callback error                                            */}
      {/* ============================================================ */}

      {zoomStatus === 'error' && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">

          <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />

          <div className="min-w-0">
            <h2 className="font-bold">
              Zoom Connection Failed
            </h2>

            <p className="mt-1 break-words text-sm text-red-700">
              {zoomMessage ||
                'Zoom connect کرتے وقت ایک خرابی پیش آئی۔'}
            </p>
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* Profile Card                                                   */}
      {/* ============================================================ */}

      <div className="mb-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

        <div className="border-b border-gray-100 bg-gray-50 px-6 py-5">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
              <User className="h-5 w-5 text-indigo-600" />
            </div>

            <div>
              <h2 className="font-bold text-gray-900">
                Teacher Account
              </h2>

              <p className="text-sm text-gray-500">
                Your account information
              </p>
            </div>
          </div>

        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">

          {/* Name */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <User className="h-4 w-4" />
              Name
            </div>

            <p className="font-semibold text-gray-900">
              {teacher.name || 'Not provided'}
            </p>
          </div>

          {/* Email */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <Mail className="h-4 w-4" />
              Email
            </div>

            <p className="break-all font-semibold text-gray-900">
              {teacher.email || 'Not provided'}
            </p>
          </div>

          {/* Academy */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <School className="h-4 w-4" />
              Academy
            </div>

            <p className="font-semibold text-gray-900">
              {academy?.name ||
                'Academy not found'}
            </p>
          </div>

          {/* Status */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <ShieldCheck className="h-4 w-4" />
              Teacher Status
            </div>

            <p
              className={`font-semibold ${
                teacher.isAvailable
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {teacher.isAvailable
                ? 'Active'
                : 'Inactive'}
            </p>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* Zoom Integration Card                                         */}
      {/* ============================================================ */}

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

        {/* Header */}
        <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-sm">
                <Video className="h-7 w-7 text-white" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Zoom Classroom
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Connect Zoom to start your assigned classes.
                </p>
              </div>

            </div>

            {/* Status badge */}
            {isZoomConnected ? (
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                Connected
              </div>
            ) : (
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                Not Connected
              </div>
            )}

          </div>

        </div>

        {/* Body */}
        <div className="p-6">

          {!isZoomConnected ? (

            <div>

              {/* Information */}
              <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">

                <div className="flex items-start gap-3">

                  <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-blue-600" />

                  <div>

                    <h3 className="font-bold text-blue-900">
                      Connect your Zoom account
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-blue-800">
                      Teacher کو اپنی assigned Zoom classes شروع کرنے کے لیے
                      اپنا Zoom account connect کرنا ہوگا۔ Connect ہونے کے بعد
                      آپ Owner کی بنائی ہوئی existing meetings کو Host کے طور پر
                      start کر سکیں گے۔
                    </p>

                  </div>

                </div>

              </div>

              {/* Connect Button */}
              <a
                href="/api/zoom/connect"
                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-xl sm:w-auto"
              >
                <Video className="h-5 w-5" />
                Connect Zoom Account
                <ExternalLink className="h-4 w-4" />
              </a>

              <p className="mt-3 text-xs text-gray-500">
                آپ کو Zoom کی authorization screen پر لے جایا جائے گا۔
              </p>

            </div>

          ) : (

            <div>

              {/* Connected message */}
              <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5">

                <div className="flex items-start gap-3">

                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />

                  <div>
                    <h3 className="font-bold text-green-900">
                      Zoom is connected
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-green-800">
                      آپ کا Zoom account اب assigned online classes کے لیے
                      استعمال کیا جا سکتا ہے۔
                    </p>
                  </div>

                </div>

              </div>

              {/* Zoom Details */}
              <div className="grid gap-4 md:grid-cols-2">

                {/* Zoom Email */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5">

                  <p className="mb-2 text-sm text-gray-500">
                    Zoom Account Email
                  </p>

                  <p className="break-all font-semibold text-gray-900">
                    {zoomConnection.zoomEmail ||
                      'Not available'}
                  </p>

                </div>

                {/* Zoom User ID */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5">

                  <p className="mb-2 text-sm text-gray-500">
                    Zoom User ID
                  </p>

                  <p className="break-all font-mono text-sm font-semibold text-gray-900">
                    {zoomConnection.zoomUserId ||
                      'Not available'}
                  </p>

                </div>

                {/* Account ID */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5">

                  <p className="mb-2 text-sm text-gray-500">
                    Zoom Account ID
                  </p>

                  <p className="break-all font-mono text-sm font-semibold text-gray-900">
                    {zoomConnection.zoomAccountId ||
                      'Not available'}
                  </p>

                </div>

                {/* Connection status */}
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

                  <p className="mb-2 text-sm text-gray-500">
                    Connection Status
                  </p>

                  <div className="flex items-center gap-2 font-semibold text-green-700">
                    <CheckCircle2 className="h-5 w-5" />
                    Zoom Connected
                  </div>

                </div>

              </div>

              {/* Important notice */}
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">

                <h3 className="font-bold text-amber-900">
                  Important
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-800">
                  Zoom meeting Owner/admin panel سے create ہوگی۔
                  Teacher یہاں سے نئی meeting create نہیں کرے گا۔
                  Teacher صرف اپنی assigned existing meeting کو
                  Host کے طور پر Start Class کرے گا۔
                </p>

              </div>

              {/* Reconnect */}
              <div className="mt-6">

                <a
                  href="/api/zoom/connect"
                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  <Video className="h-4 w-4" />
                  Reconnect Zoom
                </a>

              </div>

            </div>

          )}

        </div>
      </div>

      {/* ============================================================ */}
      {/* Security Notice                                               */}
      {/* ============================================================ */}

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />

        <div>
          <h3 className="font-semibold text-gray-800">
            Security
          </h3>

          <p className="mt-1 text-sm leading-6 text-gray-500">
            Zoom OAuth access اور refresh tokens browser میں ظاہر نہیں کیے جاتے۔
            یہ information صرف server-side database میں محفوظ رہتی ہے۔
          </p>
        </div>

      </div>

    </div>
  );
}