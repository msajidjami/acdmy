/* eslint-disable @typescript-eslint/no-explicit-any */
import { getWhatsAppManager } from '@/app/lib/whatsapp/manager';

/* ============================================================
   WhatsApp — shared via manager.ts
   ============================================================ */

export function getLatestQr(): string | null {
  return getWhatsAppManager().getStatus().qr;
}

export function isClientReady(): boolean {
  return getWhatsAppManager().getStatus().ready;
}

export function getClientState(): string {
  return getWhatsAppManager().getStatus().status;
}

export function getLastError(): string | null {
  return getWhatsAppManager().getStatus().error;
}

/* ============================================================
   Send OTP
   ============================================================ */

interface SendResult {
  success: boolean;
  error?: string;
  needsQr?: boolean;
}

export async function sendWhatsAppOtp(
  phone: string,
  code: string
): Promise<SendResult> {
  try {
    const manager = getWhatsAppManager();
    const status = manager.getStatus();

    if (status.status === 'disconnected') {
      void manager.start();
      await new Promise((r) => setTimeout(r, 2000));
    }

    const afterStart = manager.getStatus();

    if (!afterStart.ready) {
      return {
        success: false,
        error:
          'WhatsApp ابھی connect نہیں ہوا — QR اسکین کریں: /api/auth/whatsapp/qr',
        needsQr: true,
      };
    }

    const sock = manager.getSock();
    if (!sock) {
      return {
        success: false,
        error: 'WhatsApp socket دستیاب نہیں',
        needsQr: true,
      };
    }

    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return { success: false, error: 'Invalid phone number' };
    }

    const jid = `${cleanPhone}@s.whatsapp.net`;

    const message =
      `*ILMORA786 Verification Code*\n\n` +
      `Your OTP is: *${code}*\n\n` +
      `This code will expire in 5 minutes.\n` +
      `Do not share this code with anyone.`;

    await sock.sendMessage(jid, { text: message });

    console.log('[whatsapp] ✅ OTP sent to', cleanPhone);

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[whatsapp] send failed:', msg);

    return {
      success: false,
      error: msg,
      needsQr: !getWhatsAppManager().getStatus().ready,
    };
  }
}

export async function logoutWhatsApp(): Promise<void> {
  await getWhatsAppManager().logout();
}

export async function startWhatsApp(): Promise<void> {
  await getWhatsAppManager().start();
}