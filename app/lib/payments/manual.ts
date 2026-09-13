import crypto from 'crypto';
import type {
  PaymentInitInput,
  PaymentInitResult,
} from './types';

/* ============================================================
   Manual Payment (Bank Transfer / JazzCash Number / Easypaisa)
   ============================================================ */

export function initManual(
  input: PaymentInitInput
): PaymentInitResult {
  // Reference for the customer to use in their transfer
  const reference = `ACD-${String(input.academyId).slice(-6).toUpperCase()}-${Date.now()
    .toString()
    .slice(-6)}`;

  return {
    success: true,
    gateway: 'manual',
    redirectUrl: null,
    gatewayReference: reference,
    instructions: {
      bankName: process.env.MANUAL_BANK_NAME || 'Meezan Bank',
      accountTitle:
        process.env.MANUAL_BANK_ACCOUNT_TITLE || 'Your Company Name',
      accountNumber: process.env.MANUAL_BANK_ACCOUNT_NUMBER || '0123456789',
      iban:
        process.env.MANUAL_BANK_IBAN || 'PK00MEZN0000000123456789',
      jazzcashNumber:
        process.env.MANUAL_JAZZCASH_NUMBER || '+92 300 0000000',
      easypaisaNumber:
        process.env.MANUAL_EASYPaisa_NUMBER || '+92 300 0000000',
      reference,
    },
  };
}

/** Generate a short hash of the receipt for admin verification */
export function generateReceiptHash(
  subscriptionId: string,
  txId: string
): string {
  return crypto
    .createHash('sha256')
    .update(`${subscriptionId}::${txId}`)
    .digest('hex')
    .slice(0, 12)
    .toUpperCase();
}