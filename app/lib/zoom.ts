// app/lib/zoom.ts

const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

let cachedToken: {
  access_token: string;
  expires_at: number;
} | null = null;

class ZoomNetworkError extends Error {
  code = 'ZOOM_NETWORK_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'ZoomNetworkError';
  }
}

/**
 * Zoom OAuth token حاصل کرنے کے لیے محفوظ fetch
 */
async function fetchZoomToken(
  url: string,
  options: RequestInit,
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (error: any) {
    const errorCode =
      error?.cause?.code ||
      error?.code ||
      '';

    if (
      errorCode === 'UND_ERR_CONNECT_TIMEOUT' ||
      errorCode === 'ETIMEDOUT' ||
      error?.name === 'AbortError'
    ) {
      throw new ZoomNetworkError(
        'Zoom server سے رابطہ نہیں ہو سکا۔ آپ کے server سے zoom.us:443 پر connection timeout ہو رہا ہے۔'
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Zoom Server سے OAuth Access Token حاصل کریں
 */
export async function getZoomAccessToken(): Promise<string> {
  /*
   * پہلے environment variables چیک کریں
   */
  if (
    !ZOOM_ACCOUNT_ID ||
    !ZOOM_CLIENT_ID ||
    !ZOOM_CLIENT_SECRET
  ) {
    throw new Error(
      'Zoom environment variables missing. Required: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET'
    );
  }

  /*
   * اگر cached token ابھی valid ہے
   * تو Zoom سے دوبارہ token لینے کی ضرورت نہیں
   *
   * ہم expiry سے 60 سیکنڈ پہلے ہی نیا token لیتے ہیں
   */
  if (
    cachedToken &&
    Date.now() < cachedToken.expires_at - 60_000
  ) {
    return cachedToken.access_token;
  }

  const credentials = Buffer.from(
    `${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`
  ).toString('base64');

  let response: Response;

  try {
    response = await fetchZoomToken(
      'https://zoom.us/oauth/token',
      {
        method: 'POST',

        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type':
            'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },

        body: new URLSearchParams({
          grant_type: 'account_credentials',
          account_id: ZOOM_ACCOUNT_ID,
        }).toString(),
      },
      15000
    );
  } catch (error: any) {
    console.error(
      '❌ Zoom OAuth connection error:',
      error
    );

    /*
     * Network / timeout error کو واضح message کے ساتھ اوپر بھیجیں
     */
    if (error instanceof ZoomNetworkError) {
      throw error;
    }

    throw new Error(
      `Unable to connect to Zoom OAuth server: ${
        error?.message || 'Unknown network error'
      }`
    );
  }

  const responseText = await response.text();

  /*
   * Zoom نے HTTP error واپس کیا
   */
  if (!response.ok) {
    console.error(
      '❌ Zoom OAuth error:',
      response.status,
      responseText
    );

    let zoomError = responseText;

    try {
      const parsed = JSON.parse(responseText);

      zoomError =
        parsed?.reason ||
        parsed?.message ||
        parsed?.error ||
        responseText;
    } catch {
      // JSON نہ ہو تو raw text استعمال ہوگا
    }

    throw new Error(
      `Failed to get Zoom access token (${response.status}): ${zoomError}`
    );
  }

  /*
   * Successful response
   */
  let data: any;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      'Zoom OAuth server نے invalid response دیا۔'
    );
  }

  if (!data?.access_token) {
    throw new Error(
      'Zoom OAuth response میں access_token موجود نہیں ہے۔'
    );
  }

  const expiresIn =
    Number(data.expires_in) || 3600;

  /*
   * Token کو memory میں cache کریں
   *
   * 60 سیکنڈ پہلے expiry مان لیتے ہیں تاکہ
   * request کے دوران token expire نہ ہو۔
   */
  cachedToken = {
    access_token: data.access_token,

    expires_at:
      Date.now() +
      Math.max(expiresIn - 60, 60) * 1000,
  };

  console.log(
    '✅ Zoom access token obtained successfully'
  );

  return cachedToken.access_token;
}

/**
 * ضرورت پڑنے پر cached Zoom token صاف کریں۔
 *
 * اگر Zoom کبھی 401 دے تو create-meeting route
 * اس function کو استعمال کر کے دوبارہ token لے سکتا ہے۔
 */
export function clearZoomAccessToken(): void {
  cachedToken = null;
}