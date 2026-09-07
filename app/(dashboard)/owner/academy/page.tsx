import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';

import Link from 'next/link';
import DeleteAcademyButton from '@/app/components/DeleteAcademyButton';

type JwtPayload = {
userId?: string;
role?: string;
};

export const dynamic = 'force-dynamic';

type PageProps = {
searchParams?: Promise<{
success?: string;
zoom?: string;
}>;
};

export default async function OwnerAcademyPage({
searchParams,
}: PageProps) {
// --------------------------------------------------
// 1. Authentication
// --------------------------------------------------

const cookieStore = await cookies();

const token =
cookieStore.get('token')?.value;

if (!token) {
redirect('/login');
}

let userId = '';
let userRole = '';

try {
const jwtSecret =
process.env.JWT_SECRET;


if (!jwtSecret) {
  throw new Error(
    'JWT_SECRET is not configured'
  );
}

const decoded =
  jwt.verify(
    token,
    jwtSecret
  ) as JwtPayload;

userId = String(
  decoded.userId || ''
);

userRole = String(
  decoded.role || ''
);


} catch {
redirect('/login');
}

// --------------------------------------------------
// 2. Authorization
// --------------------------------------------------

if (
userRole !== 'owner' &&
userRole !== 'admin'
) {
redirect('/');
}

// --------------------------------------------------
// 3. Database
// --------------------------------------------------

await connectDB();

const academy =
await Academy.findOne({
ownerId: userId,
}).lean();

const isEditing =
Boolean(academy);

const params =
searchParams
? await searchParams
: {};

const isSuccess =
params.success === 'true';

const zoomConnected =
academy?.zoomConnected === true &&
Boolean(
academy?.zoomHostUserId
);

const zoomNotConfigured =
params.zoom ===
'not-configured';

// --------------------------------------------------
// 4. Page
// --------------------------------------------------

return ( <div className="max-w-2xl mx-auto pb-12">

```
  {/* -------------------------------------------- */}
  {/* Header */}
  {/* -------------------------------------------- */}

  <div className="mb-8">
    <h1 className="text-3xl font-bold text-black">
      {isEditing
        ? '✏️ Edit Your Academy'
        : '🏛️ Register New Academy'}
    </h1>

    <p className="text-black/60 mt-1">
      {isEditing
        ? 'Update your academy details below'
        : 'Fill in the details to create your Islamic academy'}
    </p>
  </div>

  {/* -------------------------------------------- */}
  {/* Success message */}
  {/* -------------------------------------------- */}

  {isSuccess && (
    <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
      <p className="font-semibold text-green-800">
        Academy information saved successfully.
      </p>

      {params.zoom ===
        'connected' && (
        <p className="text-sm text-green-700 mt-1">
          Zoom account connected successfully.
        </p>
      )}
    </div>
  )}

  {/* -------------------------------------------- */}
  {/* Zoom status */}
  {/* -------------------------------------------- */}

  {isEditing && (
    <div
      className={`mb-6 rounded-2xl border p-5 ${
        zoomConnected
          ? 'border-green-200 bg-green-50'
          : 'border-amber-200 bg-amber-50'
      }`}
    >
      <div className="flex items-start gap-4">

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl ${
            zoomConnected
              ? 'bg-green-100'
              : 'bg-amber-100'
          }`}
        >
          {zoomConnected
            ? '✓'
            : '⚠'}
        </div>

        <div className="min-w-0 flex-1">

          <h2
            className={`font-bold ${
              zoomConnected
                ? 'text-green-800'
                : 'text-amber-800'
            }`}
          >
            {zoomConnected
              ? 'Zoom Academy Account Connected'
              : 'Zoom Academy Account Not Configured'}
          </h2>

          {zoomConnected ? (
            <div className="mt-2 space-y-1 text-sm text-green-700">

              <p>
                <span className="font-medium">
                  Host Email:
                </span>{' '}
                {academy?.zoomHostEmail ||
                  'Not available'}
              </p>

              <p>
                <span className="font-medium">
                  Zoom Host ID:
                </span>{' '}
                {academy?.zoomHostUserId ||
                  'Not available'}
              </p>

              <p>
                <span className="font-medium">
                  Account ID:
                </span>{' '}
                {academy?.zoomAccountId ||
                  'Not available'}
              </p>

              <p className="pt-2 text-xs text-green-600">
                This Zoom account will be used as the
                host for academy online classes.
              </p>

            </div>
          ) : (
            <div className="mt-2 text-sm text-amber-700">
              <p>
                Zoom is not configured for this
                academy yet.
              </p>

              <p className="mt-1">
                Save this academy after configuring
                the Zoom Server-to-Server OAuth
                credentials in your environment.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )}

  {/* -------------------------------------------- */}
  {/* Academy form */}
  {/* -------------------------------------------- */}

  <form
    action="/api/owner/academy"
    method="POST"
    className="bg-white p-8 rounded-3xl shadow-lg border border-black/5 space-y-6"
  >

    {/* Academy name */}

    <div className="space-y-2">
      <label className="block text-sm font-medium text-black/80">
        Academy Name{' '}
        <span className="text-red-500">
          *
        </span>
      </label>

      <input
        type="text"
        name="name"
        defaultValue={
          academy?.name || ''
        }
        required
        placeholder="e.g., Al-Qalam Islamic Academy"
        className="w-full px-4 py-3 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white/50"
      />
    </div>

    {/* Description */}

    <div className="space-y-2">
      <label className="block text-sm font-medium text-black/80">
        Description{' '}
        <span className="text-red-500">
          *
        </span>
      </label>

      <textarea
        name="description"
        rows={4}
        defaultValue={
          academy?.description || ''
        }
        required
        placeholder="Describe your academy, its vision, and what you offer..."
        className="w-full px-4 py-3 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white/50 resize-none"
      />
    </div>

    {/* Contact Email */}

    <div className="space-y-2">
      <label className="block text-sm font-medium text-black/80">
        Contact Email{' '}
        <span className="text-red-500">
          *
        </span>
      </label>

      <input
        type="email"
        name="contactEmail"
        defaultValue={
          academy?.contactEmail || ''
        }
        required
        placeholder="academy@example.com"
        className="w-full px-4 py-3 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white/50"
      />
    </div>

    {/* Logo */}

    <div className="space-y-2">
      <label className="block text-sm font-medium text-black/80">
        Logo URL{' '}
        <span className="text-black/40 text-xs">
          (optional)
        </span>
      </label>

      <input
        type="url"
        name="logo"
        defaultValue={
          academy?.logo || ''
        }
        placeholder="https://example.com/logo.png"
        className="w-full px-4 py-3 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white/50"
      />
    </div>

    {/* Slug */}

    <div className="space-y-2">
      <label className="block text-sm font-medium text-black/80">
        Slug{' '}
        <span className="text-black/40 text-xs">
          (optional - for URL)
        </span>
      </label>

      <input
        type="text"
        name="slug"
        defaultValue={
          academy?.slug || ''
        }
        placeholder="e.g., al-qalam-academy"
        className="w-full px-4 py-3 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white/50"
      />

      <p className="text-xs text-black/40">
        This will be used in the URL:
        {' '}
        quranandislamic.com/academy/
        <span className="text-green-600 font-medium">
          {academy?.slug ||
            'your-slug'}
        </span>
      </p>
    </div>

    {/* Buttons */}

    <div className="flex flex-col sm:flex-row gap-3 pt-2">

      <button
        type="submit"
        className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 hover:shadow-green-600/40 transition-all duration-300"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
          />
        </svg>

        {isEditing
          ? 'Save Changes'
          : 'Create Academy'}
      </button>

      <Link
        href="/owner/dashboard"
        className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-black/5 hover:bg-black/10 text-black/70 font-medium rounded-xl transition-all duration-300"
      >
        Cancel
      </Link>

    </div>

    <p className="text-xs text-black/40 text-center mt-4">
      All fields marked with{' '}
      <span className="text-red-500">
        *
      </span>{' '}
      are required.
    </p>

  </form>

  {/* -------------------------------------------- */}
  {/* Delete academy */}
  {/* -------------------------------------------- */}

  {isEditing && (
    <div className="mt-6 text-center">
      <DeleteAcademyButton
        academyId={academy._id.toString()}
      />
    </div>
  )}

</div>


);
}
