export const PAYMENT_DETAILS = {
  payoneer: {
    name: 'Payoneer',
    type: 'payoneer' as const,
    email: process.env.NEXT_PUBLIC_PAYONEER_EMAIL || 'your@payoneer.com',
    accountHolder:
      process.env.NEXT_PUBLIC_PAYONEER_NAME || 'Muhammad Sajid',
    currency: 'USD',
    instructions: [
      'Log in to your Payoneer account',
      'Send payment to the email address above',
      'Include your Reference ID in the payment note',
      'Take a screenshot of the confirmation',
      'Submit the screenshot as receipt',
    ],
  },
  bank_transfer: {
    name: 'Bank Transfer',
    type: 'bank_transfer' as const,
    bankName: process.env.NEXT_PUBLIC_BANK_NAME || 'Meezan Bank',
    accountTitle:
      process.env.NEXT_PUBLIC_BANK_ACCOUNT_TITLE || 'Muhammad Sajid',
    accountNumber:
      process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || '0123456789',
    iban: process.env.NEXT_PUBLIC_BANK_IBAN || 'PK00MEZN0000000123456789',
    currency: 'PKR',
    instructions: [
      'Transfer the amount to the account above',
      'Include your Reference ID in the transfer description',
      'Take a screenshot of the confirmation',
      'Submit the screenshot as receipt',
    ],
  },
  jazzcash: {
    name: 'JazzCash',
    type: 'jazzcash' as const,
    number: process.env.NEXT_PUBLIC_JAZZCASH_NUMBER || '+92 300 0000000',
    accountTitle:
      process.env.NEXT_PUBLIC_JAZZCASH_NAME || 'Muhammad Sajid',
    currency: 'PKR',
    instructions: [
      'Open JazzCash app',
      'Send money to the number above',
      'Include Reference ID in the memo',
      'Take a screenshot of confirmation',
      'Submit the screenshot as receipt',
    ],
  },
  easypaisa: {
    name: 'Easypaisa',
    type: 'easypaisa' as const,
    number: process.env.NEXT_PUBLIC_EASYPAISA_NUMBER || '+92 300 0000000',
    accountTitle:
      process.env.NEXT_PUBLIC_EASYPAISA_NAME || 'Muhammad Sajid',
    currency: 'PKR',
    instructions: [
      'Open Easypaisa app',
      'Send money to the number above',
      'Include Reference ID in the memo',
      'Take a screenshot of confirmation',
      'Submit the screenshot as receipt',
    ],
  },
};

export type PaymentMethodKey = keyof typeof PAYMENT_DETAILS;

export function getPaymentDetails(method: PaymentMethodKey) {
  return PAYMENT_DETAILS[method];
}

export function getMethodCurrency(method: PaymentMethodKey): 'USD' | 'PKR' {
  return method === 'payoneer' ? 'USD' : 'PKR';
}

export function generateReference(academyId: string): string {
  const short = String(academyId).slice(-6).toUpperCase();
  const ts = Date.now().toString().slice(-6);
  return `ACD-${short}-${ts}`;
}