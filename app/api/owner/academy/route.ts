import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type JwtPayload = {
userId?: string;
role?: string;
};

type ZoomMeResponse = {
id?: string;
email?: string;
first_name?: string;
last_name?: string;
};

function getEnv(name: string): string {
const value = process.env[name]?.trim();

if (!value) {
throw new Error(`${name} is not configured`);
}

return value;
}

/**

* Get a fresh Server-to-Server OAuth access token from Zoom.
*
* Zoom S2S OAuth does not use a refresh token.
* A new access token is requested when needed.
  */
  async function getZoomAccessToken(): Promise<string> {
  const accountId = getEnv('ZOOM_ACCOUNT_ID');
  const clientId = getEnv('ZOOM_CLIENT_ID');
  const clientSecret = getEnv('ZOOM_CLIENT_SECRET');

const basicAuth = Buffer.from(
`${clientId}:${clientSecret}`
).toString('base64');

const body = new URLSearchParams();

body.set('grant_type', 'account_credentials');
body.set('account_id', accountId);

const response = await fetch(
'https://zoom.us/oauth/token',
{
method: 'POST',
headers: {
Authorization: `Basic ${basicAuth}`,
'Content-Type':
'application/x-www-form-urlencoded',
},
body: body.toString(),
cache: 'no-store',
}
);

const data = await response.json().catch(() => null);

if (!response.ok || !data?.access_token) {
console.error(
'Zoom token error:',
data
);


throw new Error(
  data?.reason ||
    data?.message ||
    `Zoom authentication failed (HTTP ${response.status})`
);


}

return String(data.access_token);
}

/**

* Get the Zoom account owner's actual Zoom User ID.
*
* IMPORTANT:
* This is NOT the email address.
  */
  async function getZoomAccountUser(
  accessToken: string
  ): Promise<{
  userId: string;
  email: string;
  }> {
  const response = await fetch(
  'https://api.zoom.us/v2/users/me',
  {
  method: 'GET',
  headers: {
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
  },
  cache: 'no-store',
  }
  );

const data =
(await response.json().catch(() => null)) as
| ZoomMeResponse
| null;

if (!response.ok) {
console.error(
'Zoom /users/me error:',
data
);


throw new Error(
  `Unable to read Zoom account information (HTTP ${response.status})`
);


}

if (!data?.id) {
throw new Error(
'Zoom account user ID was not returned.'
);
}

return {
userId: String(data.id),
email: String(data.email || ''),
};
}

/**

* Configure the Academy's Zoom host account.
*
* This uses the global Server-to-Server OAuth app
* configured in .env.local.
  */
  async function configureAcademyZoom(
  academy: any
  ): Promise<{
  connected: boolean;
  accountId: string;
  hostUserId: string;
  hostEmail: string;
  }> {
  try {
  const accountId = getEnv(
  'ZOOM_ACCOUNT_ID'
  );

  const accessToken =
  await getZoomAccessToken();

  const zoomUser =
  await getZoomAccountUser(
  accessToken
  );

  academy.zoomConnected = true;
  academy.zoomAccountId =
  accountId;

  academy.zoomHostUserId =
  zoomUser.userId;

  academy.zoomHostEmail =
  zoomUser.email;

  await academy.save();

  return {
  connected: true,
  accountId,
  hostUserId: zoomUser.userId,
  hostEmail: zoomUser.email,
  };
  } catch (error) {
  console.error(
  'Academy Zoom configuration failed:',
  error
  );

  /*

  * Do not destroy the academy if Zoom configuration
  * fails. The academy itself can still be saved.
    */

  academy.zoomConnected = false;
  academy.zoomAccountId = '';
  academy.zoomHostUserId = '';
  academy.zoomHostEmail = '';

  await academy.save();

  return {
  connected: false,
  accountId: '',
  hostUserId: '',
  hostEmail: '',
  };
  }
  }

export async function POST(
request: NextRequest
) {
try {
// --------------------------------------------------
// 1. Authenticate current user
// --------------------------------------------------


const cookieStore = await cookies();

const token =
  cookieStore.get('token')?.value;

if (!token) {
  return NextResponse.redirect(
    new URL('/login', request.url)
  );
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
  return NextResponse.redirect(
    new URL('/login', request.url)
  );
}

if (!userId) {
  return NextResponse.redirect(
    new URL('/login', request.url)
  );
}

// Only owner/admin can manage academy.
if (
  userRole !== 'owner' &&
  userRole !== 'admin'
) {
  return NextResponse.redirect(
    new URL('/', request.url)
  );
}

// --------------------------------------------------
// 2. Read form data
// --------------------------------------------------

const formData =
  await request.formData();

const name =
  String(
    formData.get('name') || ''
  ).trim();

const description =
  String(
    formData.get('description') || ''
  ).trim();

const contactEmail =
  String(
    formData.get('contactEmail') || ''
  )
    .trim()
    .toLowerCase();

const logo =
  String(
    formData.get('logo') || ''
  ).trim();

const slug =
  String(
    formData.get('slug') || ''
  ).trim()
  .toLowerCase();

// --------------------------------------------------
// 3. Validate
// --------------------------------------------------

if (
  !name ||
  !description ||
  !contactEmail
) {
  return NextResponse.json(
    {
      success: false,
      error:
        'Name, description, and contact email are required',
    },
    { status: 400 }
  );
}

// --------------------------------------------------
// 4. Connect database
// --------------------------------------------------

await connectDB();

// --------------------------------------------------
// 5. Find existing academy
// --------------------------------------------------

const existingAcademy =
  await Academy.findOne({
    ownerId: userId,
  });

// --------------------------------------------------
// 6. Prepare slug
// --------------------------------------------------

let finalSlug = slug;

if (!finalSlug) {
  finalSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!finalSlug) {
    finalSlug =
      `academy-${Date.now()}`;
  }
}

// --------------------------------------------------
// 7. Make slug unique
// --------------------------------------------------

const slugExists =
  await Academy.findOne({
    slug: finalSlug,
    ...(existingAcademy
      ? {
          _id: {
            $ne:
              existingAcademy._id,
          },
        }
      : {}),
  });

if (slugExists) {
  finalSlug =
    `${finalSlug}-${Date.now()
      .toString()
      .slice(-6)}`;
}

// --------------------------------------------------
// 8. Create / update academy
// --------------------------------------------------

let academy;

if (existingAcademy) {
  existingAcademy.name =
    name;

  existingAcademy.description =
    description;

  existingAcademy.contactEmail =
    contactEmail;

  existingAcademy.logo =
    logo;

  existingAcademy.slug =
    finalSlug;

  existingAcademy.isActive =
    true;

  academy =
    await existingAcademy.save();
} else {
  academy =
    await Academy.create({
      ownerId: userId,
      name,
      description,
      contactEmail,
      logo,
      slug: finalSlug,
      isActive: true,

      // Zoom defaults
      zoomConnected: false,
      zoomAccountId: '',
      zoomHostUserId: '',
      zoomHostEmail: '',
    });
}

// --------------------------------------------------
// 9. Automatically configure Academy Zoom
// --------------------------------------------------

const zoomResult =
  await configureAcademyZoom(
    academy
  );

// --------------------------------------------------
// 10. Redirect
// --------------------------------------------------

const redirectUrl =
  new URL(
    '/owner/academy',
    request.url
  );

redirectUrl.searchParams.set(
  'success',
  'true'
);

if (zoomResult.connected) {
  redirectUrl.searchParams.set(
    'zoom',
    'connected'
  );
} else {
  redirectUrl.searchParams.set(
    'zoom',
    'not-configured'
  );
}

return NextResponse.redirect(
  redirectUrl
);


} catch (error) {
console.error(
'Academy creation/update error:',
error
);


return NextResponse.json(
  {
    success: false,
    error:
      error instanceof Error
        ? error.message
        : 'Internal server error',
  },
  { status: 500 }
);


}
}
