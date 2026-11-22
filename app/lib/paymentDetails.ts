
/* ============================================================
   PAYMENT DETAILS — CLIENT SAFE

   This file contains only public payment information.
   Never import Firebase Admin or server-only modules here.
============================================================ */

/* ============================================================
   PAYMENT METHOD TYPES
============================================================ */

export type PaymentMethodKey =
  | "payoneer"
  | "bank_transfer"
  | "jazzcash"
  | "easypaisa";

export interface PayoneerDetails {
  name: string;
  email: string;
  accountHolder: string;
  instructions: readonly string[];
}

export interface BankTransferDetails {
  name: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  instructions: readonly string[];
}

export interface WalletDetails {
  name: string;
  number: string;
  accountTitle: string;
  instructions: readonly string[];
}

export type PaymentDetails =
  | PayoneerDetails
  | BankTransferDetails
  | WalletDetails;

/* ============================================================
   PAYMENT DETAILS CONFIGURATION

   IMPORTANT:
   Replace the placeholder values below with your real
   payment account details before accepting payments.
============================================================ */

export const PAYMENT_DETAILS: Record<
  PaymentMethodKey,
  PaymentDetails
> = {
  payoneer: {
    name: "Payoneer",
    email: "YOUR_PAYONEER_EMAIL",
    accountHolder: "YOUR_PAYONEER_ACCOUNT_NAME",
    instructions: [
      "Send the exact USD amount shown on the checkout page.",
      "Use your payment reference in the payment description.",
      "Keep your transaction confirmation for verification.",
    ],
  },

  bank_transfer: {
    name: "Bank Transfer",
    bankName: "YOUR_BANK_NAME",
    accountTitle: "YOUR_ACCOUNT_TITLE",
    accountNumber: "YOUR_ACCOUNT_NUMBER",
    iban: "YOUR_BANK_IBAN",
    instructions: [
      "Transfer the exact PKR amount shown on the checkout page.",
      "Include your payment reference in the transfer remarks.",
      "Save your bank transaction receipt.",
    ],
  },

  jazzcash: {
    name: "JazzCash",
    number: "03XXXXXXXXX",
    accountTitle: "YOUR_JAZZCASH_ACCOUNT_TITLE",
    instructions: [
      "Send the exact PKR amount to the JazzCash number above.",
      "Include your payment reference in the payment details if available.",
      "Save your transaction ID and confirmation.",
    ],
  },

  easypaisa: {
    name: "Easypaisa",
    number: "03XXXXXXXXX",
    accountTitle: "YOUR_EASYPAISA_ACCOUNT_TITLE",
    instructions: [
      "Send the exact PKR amount to the Easypaisa number above.",
      "Include your payment reference in the payment details if available.",
      "Save your transaction ID and confirmation.",
    ],
  },
};

/* ============================================================
   CURRENCY HELPER
============================================================ */

export type PaymentCurrency = "USD" | "PKR";

export function getMethodCurrency(
  method: PaymentMethodKey
): PaymentCurrency {
  return method === "payoneer" ? "USD" : "PKR";
}

/* ============================================================
   PAYMENT REFERENCE GENERATOR

   Generates a unique-looking manual payment reference.
   This is an identifier, not proof of payment.
============================================================ */

export function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();

  const randomPart = Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()
    .padEnd(6, "0");

  return `ILM-${timestamp}-${randomPart}`;
}

/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default PAYMENT_DETAILS;
