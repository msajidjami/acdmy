
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getZoomAccessToken } from '@/app/lib/zoom';

export const dynamic = 'force-dynamic';

type ZoomRole = 0 | 1;

export async function POST(
  request: Request
) {
  try {
    // =========================================================
    // Read request
    // =========================================================

    const body = await request.json();

    const meetingNumber = String(
      body?.meetingNumber || ''
    ).trim();

    if (!meetingNumber) {
      return NextResponse.json(
        {
          error:
            'Meeting number is required.',
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // Role
    //
    // 0 = Participant
    // 1 = Host
    // =========================================================

    const requestedRole =
      Number(body?.role);

    const role: ZoomRole =
      requestedRole === 1
        ? 1
        : 0;

    // =========================================================
    // Optional Zoom host user ID
    //
    // For role=1 this must identify the actual Zoom user
    // who owns / hosts the meeting.
    // =========================================================

    const requestedHostUserId =
      String(
        body?.hostUserId || ''
      ).trim();

    // =========================================================
    // Zoom Meeting SDK credentials
    // =========================================================

    const clientId =
      process.env
        .ZOOM_MEETING_SDK_CLIENT_ID;

    const clientSecret =
      process.env
        .ZOOM_MEETING_SDK_CLIENT_SECRET;

    if (
      !clientId ||
      !clientSecret
    ) {
      console.error(
        '❌ Missing Zoom Meeting SDK credentials.'
      );

      return NextResponse.json(
        {
          error:
            'Zoom Meeting SDK credentials are not configured.',
        },
        {
          status: 500,
        }
      );
    }

    // =========================================================
    // HOST AUTHORIZATION
    //
    // Zoom requires:
    //
    // role = 1
    // +
    // host user's ZAK
    //
    // =========================================================

    let zak: string | undefined;

    let zoomUserId =
      requestedHostUserId;

    if (role === 1) {
      try {
        const accessToken =
          await getZoomAccessToken();

        if (!accessToken) {
          return NextResponse.json(
            {
              error:
                'Zoom access token could not be obtained for Host authorization.',
            },
            {
              status: 500,
            }
          );
        }

        // =====================================================
        // If host ID was not supplied, get current Zoom user.
        // =====================================================

        if (!zoomUserId) {
          const meResponse =
            await fetch(
              'https://api.zoom.us/v2/users/me',
              {
                method: 'GET',

                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,

                  'Content-Type':
                    'application/json',
                },

                cache: 'no-store',
              }
            );

          const meText =
            await meResponse.text();

          if (!meResponse.ok) {
            console.error(
              '❌ Could not get Zoom current user:',
              meText
            );

            return NextResponse.json(
              {
                error:
                  'Could not determine the Zoom host user.',

                details:
                  meText,
              },
              {
                status: 500,
              }
            );
          }

          let meData: any;

          try {
            meData =
              JSON.parse(
                meText
              );
          } catch {
            return NextResponse.json(
              {
                error:
                  'Invalid response from Zoom while determining host user.',
              },
              {
                status: 500,
              }
            );
          }

          zoomUserId =
            String(
              meData?.id ||
                ''
            ).trim();
        }

        if (!zoomUserId) {
          return NextResponse.json(
            {
              error:
                'Zoom host user ID is missing.',
            },
            {
              status: 500,
            }
          );
        }

        // =====================================================
        // Get ZAK
        //
        // GET /users/{userId}/token?type=zak
        // =====================================================

        console.log(
          '🔐 Requesting Zoom Host ZAK:',
          {
            zoomUserId,

            meetingNumber,
          }
        );

        const zakUrl =
          `https://api.zoom.us/v2/users/${encodeURIComponent(
            zoomUserId
          )}/token?type=zak`;

        const zakResponse =
          await fetch(
            zakUrl,
            {
              method: 'GET',

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,

                'Content-Type':
                  'application/json',
              },

              cache: 'no-store',
            }
          );

        const zakText =
          await zakResponse.text();

        if (!zakResponse.ok) {
          console.error(
            '❌ Zoom ZAK request failed:',
            {
              status:
                zakResponse.status,

              response:
                zakText,

              zoomUserId,
            }
          );

          return NextResponse.json(
            {
              error:
                'Zoom Host authorization failed. Could not obtain a valid Host ZAK for this Zoom user.',

              details:
                zakText,
            },
            {
              status: 403,
            }
          );
        }

        let zakData: any;

        try {
          zakData =
            JSON.parse(
              zakText
            );
        } catch {
          return NextResponse.json(
            {
              error:
                'Invalid ZAK response from Zoom.',
            },
            {
              status: 500,
            }
          );
        }

        zak =
          String(
            zakData?.token ||
              ''
          ).trim();

        if (!zak) {
          return NextResponse.json(
            {
              error:
                'Zoom did not return a Host ZAK.',
            },
            {
              status: 403,
            }
          );
        }

        console.log(
          '✅ Zoom Host ZAK obtained.'
        );
      } catch (zakError: any) {
        console.error(
          '❌ Host ZAK error:',
          zakError
        );

        return NextResponse.json(
          {
            error:
              zakError?.message ||
              'Unable to authorize Zoom Host.',
          },
          {
            status: 500,
          }
        );
      }
    }

    // =========================================================
    // JWT timestamps
    // =========================================================

    const iat =
      Math.floor(
        Date.now() / 1000
      );

    // 2 hours
    const exp =
      iat +
      60 * 60 * 2;

    // =========================================================
    // JWT Header
    // =========================================================

    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    // =========================================================
    // Meeting SDK JWT payload
    // =========================================================

    const payload = {
      appKey: clientId,

      mn: meetingNumber,

      role,

      iat,

      exp,

      tokenExp: exp,
    };

    // =========================================================
    // Base64URL helper
    // =========================================================

    const base64UrlEncode = (
      value: string
    ): string => {
      return Buffer.from(
        value
      )
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
    };

    // =========================================================
    // Encode header
    // =========================================================

    const encodedHeader =
      base64UrlEncode(
        JSON.stringify(
          header
        )
      );

    // =========================================================
    // Encode payload
    // =========================================================

    const encodedPayload =
      base64UrlEncode(
        JSON.stringify(
          payload
        )
      );

    // =========================================================
    // Unsigned JWT
    // =========================================================

    const unsignedToken =
      `${encodedHeader}.${encodedPayload}`;

    // =========================================================
    // HS256 signature
    // =========================================================

    const encodedSignature =
      crypto
        .createHmac(
          'sha256',
          clientSecret
        )
        .update(
          unsignedToken
        )
        .digest('base64')
        .replace(
          /\+/g,
          '-'
        )
        .replace(
          /\//g,
          '_'
        )
        .replace(
          /=+$/g,
          ''
        );

    // =========================================================
    // Final signature
    // =========================================================

    const signature =
      `${unsignedToken}.${encodedSignature}`;

    // =========================================================
    // Debug
    // =========================================================

    console.log(
      '✅ Zoom Meeting SDK signature generated:',
      {
        meetingNumber,

        role,

        roleName:
          role === 1
            ? 'HOST'
            : 'PARTICIPANT',

        zoomUserId:
          zoomUserId || null,

        hasZAK:
          Boolean(zak),

        iat,

        exp,

        clientIdPrefix:
          clientId.substring(
            0,
            8
          ),
      }
    );

    // =========================================================
    // Response
    // =========================================================

    return NextResponse.json({
      success: true,

      signature,

      role,

      meetingNumber,

      // Host receives ZAK.
      // Participant does not.
      ...(role === 1 && zak
        ? {
            zak,
            hostUserId:
              zoomUserId,
          }
        : {}),
    });
  } catch (error: any) {
    console.error(
      '❌ Zoom signature generation error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Internal server error.',
      },
      {
        status: 500,
      }
    );
  }
}

