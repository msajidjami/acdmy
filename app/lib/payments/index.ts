import type {
  PaymentGatewayId,
  PaymentInitInput,
  PaymentInitResult,
} from './types';
import { initLemonSqueezy } from './lemonsqueezy';
import { initJazzCash } from './jazzcash';
import { initManual } from './manual';

export * from './types';
export * from './gateways';

export async function initPayment(
  gateway: PaymentGatewayId,
  input: PaymentInitInput
): Promise<PaymentInitResult> {
  switch (gateway) {
    case 'lemonsqueezy':
      return initLemonSqueezy(input);

    case 'jazzcash':
      return initJazzCash(input);

    case 'easypaisa':
      // Easypaisa کے لیے manual instructions بھیجیں
      return initManual(input);

    case 'manual':
      return initManual(input);

    case 'stripe':
      return {
        success: false,
        gateway: 'stripe',
        error: 'Stripe integration not yet available.',
      };

    default:
      return {
        success: false,
        gateway,
        error: `Unknown gateway: ${gateway}`,
      };
  }
}