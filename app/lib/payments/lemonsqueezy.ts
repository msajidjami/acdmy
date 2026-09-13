import type {
  PaymentInitInput,
  PaymentInitResult,
  PaymentVerifyResult,
  PaymentVerifyInput,
} from './types';

/* ============================================================
   LemonSqueezy Integration
   ============================================================
   API Docs: https://docs.lemonsqueezy.com/api
   ============================================================ */

const LEMON_API_KEY = process.env.LEMONSQUEEZY_API_KEY || '';
const LEMON_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID || '';
const LEMON_VARIANT_STARTER = process.env.LEMONSQUEEZY_VARIANT_STARTER || '';
const LEMON_VARIANT_GROWTH = process.env.LEMONSQUEEZY_VARIANT_GROWTH || '';
const LEMON_VARIANT_PRO = process.env.LEMONSQUEEZY_VARIANT_PRO || '';
const LEMON_VARIANT_BUSINESS = process.env.LEMONSQUEEZY_VARIANT_BUSINESS || '';
const LEMON_VARIANT_ENTERPRISE =
  process.env.LEMONSQUEEZY_VARIANT_ENTERPRISE || '';

export function getLemonVariantId(planId: string): string {
  switch (planId) {
    case 'starter':
      return LEMON_VARIANT_STARTER;
    case 'growth':
      return LEMON_VARIANT_GROWTH;
    case 'pro':
      return LEMON_VARIANT_PRO;
    case 'business':
      return LEMON_VARIANT_BUSINESS;
    case 'enterprise':
      return LEMON_VARIANT_ENTERPRISE;
    default:
      return '';
  }
}

export async function initLemonSqueezy(
  input: PaymentInitInput
): Promise<PaymentInitResult> {
  if (!LEMON_API_KEY || !LEMON_STORE_ID) {
    return {
      success: false,
      gateway: 'lemonsqueezy',
      error: 'LemonSqueezy is not configured on the server.',
    };
  }

  const variantId = getLemonVariantId(input.planId);
  if (!variantId) {
    return {
      success: false,
      gateway: 'lemonsqueezy',
      error: `No LemonSqueezy variant configured for plan: ${input.planId}`,
    };
  }

  try {
    const body = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: input.customerEmail,
            name: input.customerName,
            custom: {
              subscriptionId: String(input.subscriptionId),
              academyId: String(input.academyId),
              ownerId: String(input.ownerId),
              planId: input.planId,
              billingCycle: input.billingCycle,
            },
          },
          product_options: {
            redirect_url: input.returnUrl,
            receipt_button_text: 'Go to Dashboard',
            receipt_link_url: input.returnUrl,
            receipt_thank_you_note: 'Thank you for subscribing!',
          },
          checkout_options: {
            embed: false,
            media: true,
            logo: true,
          },
          expires_at: null,
        },
        relationships: {
          store: {
            data: { type: 'stores', id: LEMON_STORE_ID },
          },
          variant: {
            data: { type: 'variants', id: variantId },
          },
        },
      },
    };

    const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${LEMON_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data: any = await res.json();

    if (!res.ok) {
      return {
        success: false,
        gateway: 'lemonsqueezy',
        error:
          data?.errors?.[0]?.detail ||
          data?.message ||
          'LemonSqueezy checkout failed',
      };
    }

    const checkoutUrl = data?.data?.attributes?.url;
    const checkoutId = data?.data?.id;

    if (!checkoutUrl) {
      return {
        success: false,
        gateway: 'lemonsqueezy',
        error: 'LemonSqueezy did not return a checkout URL.',
      };
    }

    return {
      success: true,
      gateway: 'lemonsqueezy',
      redirectUrl: checkoutUrl,
      gatewayReference: checkoutId,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'LemonSqueezy error';
    return {
      success: false,
      gateway: 'lemonsqueezy',
      error: message,
    };
  }
}

export function verifyLemonWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(rawBody, 'utf8').digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}