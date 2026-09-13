import type { PaymentGatewayMeta, PaymentGatewayId } from './types';

export const PAYMENT_GATEWAYS: PaymentGatewayMeta[] = [
  {
    id: 'lemonsqueezy',
    name: 'Card / PayPal (International)',
    description:
      'Pay with credit card, debit card, or PayPal. Best for international customers.',
    currencies: ['USD'],
    badge: 'Recommended',
    badgeColor: 'violet',
    popular: true,
    region: 'international',
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    description:
      'Pay with your JazzCash mobile wallet. For Pakistani customers.',
    currencies: ['PKR'],
    badge: 'Pakistan',
    badgeColor: 'emerald',
    region: 'pakistan',
  },
  {
    id: 'easypaisa',
    name: 'Easypaisa',
    description:
      'Pay with your Easypaisa mobile wallet. For Pakistani customers.',
    currencies: ['PKR'],
    badge: 'Pakistan',
    badgeColor: 'emerald',
    region: 'pakistan',
  },
  {
    id: 'manual',
    name: 'Bank Transfer / Manual',
    description:
      'Direct bank transfer or manual payment. Upload receipt for verification.',
    currencies: ['PKR'],
    badge: 'Alternative',
    badgeColor: 'slate',
    manual: true,
    region: 'pakistan',
  },
];

export function getGateway(
  id: PaymentGatewayId
): PaymentGatewayMeta | undefined {
  return PAYMENT_GATEWAYS.find((g) => g.id === id);
}

export function getGatewaysForCurrency(
  currency: 'USD' | 'PKR'
): PaymentGatewayMeta[] {
  return PAYMENT_GATEWAYS.filter((g) => g.currencies.includes(currency));
}