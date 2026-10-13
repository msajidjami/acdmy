/* ============================================================
   WALoops — WhatsApp OTP سروس
   فری: 100 OTPs ماہانہ
   ============================================================ */

const WALOOPS_API_BASE =
  process.env.WALOOPS_API_URL || 'https://app.waloops.com/api';

interface SendOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  raw?: any;
}

export async function sendWhatsAppOtp(
  phone: string,
  code: string
): Promise<SendOtpResponse> {
  const apiKey = process.env.WALOOPS_API_KEY;

  if (!apiKey) {
    console.error('[waloops] WALOOPS_API_KEY is not configured');
    return { success: false, error: 'Server misconfigured' };
  }

  /* Phone کو صرف ہندسوں میں */
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  /* ⚠️ WALoops کے مختلف endpoints آزمائیں گے */
  const endpoints = [
    `${WALOOPS_API_BASE}/otp/send`,
    `${WALOOPS_API_BASE}/send-otp`,
    `${WALOOPS_API_BASE}/v1/otp/send`,
  ];

  let lastError = 'Unknown error';
  let lastRaw: any = null;

  for (const url of endpoints) {
    try {
      console.log('[waloops] trying endpoint:', url);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'X-API-Key': apiKey, // کچھ APIs یہ header استعمال کرتی ہیں
        },
        body: JSON.stringify({
          phone: cleanPhone,
          otp: code,
          api_key: apiKey, // کچھ APIs body میں مانگتی ہیں
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      lastRaw = data;
      console.log('[waloops] response:', res.status, data);

      if (res.ok) {
        return {
          success: true,
          message: data?.message || 'OTP sent',
          raw: data,
        };
      }

      lastError =
        data?.message ||
        data?.error ||
        `HTTP ${res.status} from ${url}`;
    } catch (err: any) {
      console.warn('[waloops] endpoint failed:', url, err?.message);
      lastError = err?.message || 'Network error';
    }
  }

  return {
    success: false,
    error: lastError,
    raw: lastRaw,
  };
}