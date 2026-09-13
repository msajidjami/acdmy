import type {
  PaymentInitInput,
  PaymentInitResult,
} from './types';
import crypto from 'crypto';

/* ============================================================
   JazzCash Integration
   ============================================================
   Docs: https://sandbox.jazzcash.com.pk/
   ============================================================ */

const JC_MERCHANT_ID = process.env.JAZZCASH_MERCHANT_ID || '';
const JC_PASSWORD = process.env.JAZZCASH_PASSWORD || '';
const JC_INTEGRITY_SALT = process.env.JAZZCASH_INTEGRITY_SALT || '';
const JC_ENV = process.env.JAZZCASH_ENV || 'sandbox';
const JC_RETURN_URL =
  process.env.JAZZCASH_RETURN_URL ||
  'https://yourdomain.com/api/subscription/jazzcash/callback';

function jcUrl(): string {
  return JC_ENV === 'production'
    ? 'https://payments.jazzcash.com.pk/ApplicationAPI/API/Payment/DoTransaction'
    : 'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/Payment/DoTransaction';
}

/**
 * JazzCash secure hash:
 * HMAC-SHA256 of sorted "&" separated values starting with integritySalt
 */
function jcSecureHash(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  const values = sortedKeys.map((k) => params[k]).join('&');
  const stringToHash = `${JC_INTEGRITY_SALT}&${values}`;
  return crypto
    .createHmac('sha256', JC_INTEGRITY_SALT)
    .update(stringToHash)
    .digest('hex')
    .toUpperCase();
}

function jcFormatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(
    d.getDate()
  )}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export async function initJazzCash(
  input: PaymentInitInput
): Promise<PaymentInitResult> {
  if (!JC_MERCHANT_ID || !JC_PASSWORD || !JC_INTEGRITY_SALT) {
    return {
      success: false,
      gateway: 'jazzcash',
      error: 'JazzCash is not configured on the server.',
    };
  }

  try {
    // JazzCash amount in paisa (integer)
    const amountPaisa = Math.round(input.amountPKR * 100);

    const now = new Date();
    const expiry = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

    const params: Record<string, string> = {
      pp_Version: '1.1',
      pp_TxnType: 'MWALLET',
      pp_Language: 'EN',
      pp_MerchantID: JC_MERCHANT_ID,
      pp_Password: JC_PASSWORD,
      pp_TxnRefNo: `T${Date.now()}`,
      pp_Amount: String(amountPaisa),
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: jcFormatDate(now),
      pp_BillReference: String(input.subscriptionId).slice(-12),
      pp_Description: `Academy ${input.planName} subscription`,
      pp_TxnExpiryDateTime: jcFormatDate(expiry),
      pp_ReturnURL: JC_RETURN_URL,
      ppmpf_1: String(input.academyId),
      ppmpf_2: String(input.subscriptionId),
      ppmpf_3: input.planId,
      ppmpf_4: input.billingCycle,
      ppmpf_5: input.customerEmail,
    };

    // Remove empty params for hash
    const cleanParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== '' && v !== undefined && v !== null) cleanParams[k] = v;
    }

    const secureHash = jcSecureHash(cleanParams);
    cleanParams.pp_SecureHash = secureHash;

    // Build HTML auto-submit form
    const formHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Redirecting to JazzCash...</title></head>
        <body onload="document.forms[0].submit()">
          <form method="POST" action="${jcUrl()}">
            ${Object.entries(cleanParams)
              .map(
                ([k, v]) =>
                  `<input type="hidden" name="${k}" value="${String(v).replace(
                    /"/g,
                    '&quot;'
                  )}" />`
              )
              .join('')}
            <noscript>
              <p>Please click the button to continue.</p>
              <button type="submit">Continue to JazzCash</button>
            </noscript>
          </form>
        </body>
      </html>
    `;

    return {
      success: true,
      gateway: 'jazzcash',
      redirectUrl: `data:text/html;charset=utf-8,${encodeURIComponent(
        formHtml
      )}`,
      gatewayReference: cleanParams.pp_TxnRefNo,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'JazzCash error';
    return {
      success: false,
      gateway: 'jazzcash',
      error: message,
    };
  }
}

/** Verify JazzCash response secure hash */
export function verifyJazzCashResponse(
  payload: Record<string, string>
): boolean {
  if (!JC_INTEGRITY_SALT) return false;

  const received = payload.pp_SecureHash;
  if (!received) return false;

  const cleanParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (k === 'pp_SecureHash') continue;
    if (v !== '' && v !== undefined && v !== null) cleanParams[k] = v;
  }

  const expected = jcSecureHash(cleanParams);
  return expected === received;
}