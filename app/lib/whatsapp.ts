import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  type WASocket,
} from '@whiskeysockets/baileys';

import QRCode from 'qrcode-terminal';
import pino from 'pino';

/* ============================================================
   WhatsApp Client (Baileys) — Singleton
   ============================================================ */

let sock: WASocket | null = null;
let ready = false;
let initPromise: Promise<void> | null = null;

/* ✅ Latest QR — browser کو بھیجنے کے لیے */
let latestQr: string | null = null;

/* ✅ موجودہ state — clients کو بتانے کے لیے */
type ClientState = 'idle' | 'waiting_qr' | 'connecting' | 'ready' | 'logged_out';
let clientState: ClientState = 'idle';

/* ============================================================
   Public helpers (API routes کے لیے)
   ============================================================ */

export function getLatestQr(): string | null {
  return latestQr;
}

export function isClientReady(): boolean {
  return ready;
}

export function getClientState(): ClientState {
  return clientState;
}

/* ============================================================
   Init
   ============================================================ */

async function initClient(): Promise<void> {
  if (ready && sock) return;
  if (initPromise) return initPromise;

  initPromise = new Promise<void>(async (resolve, reject) => {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(
        './.baileys-auth'
      );

      const logger = pino({ level: 'silent' });

      sock = makeWASocket({
        auth: state,
        logger,
        printQRInTerminal: false,
        browser: ['ILMORA786', 'Chrome', '1.0.0'],
        /* ✅ Connection options */
        connectTimeoutMs: 60_000,
        defaultQueryTimeoutMs: 60_000,
        keepAliveIntervalMs: 25_000,
      });

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        /* ---------- نیا QR ---------- */
        if (qr) {
          latestQr = qr;
          clientState = 'waiting_qr';

          console.log(
            '\n[whatsapp] 📱 نیا QR — براؤزر میں کھولیں: http://localhost:3000/api/auth/whatsapp/qr\n'
          );

          /* Terminal میں بھی دکھائیں (اختیاری) */
          QRCode.generate(qr, { small: true });
        }

        /* ---------- Connected ---------- */
        if (connection === 'open') {
          console.log('[whatsapp] ✅ client ready');
          latestQr = null;
          ready = true;
          clientState = 'ready';
          resolve();
        }

        /* ---------- Connecting ---------- */
        if (connection === 'connecting') {
          clientState = 'connecting';
        }

        /* ---------- Closed ---------- */
        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output
            ?.statusCode;

          console.warn('[whatsapp] connection closed:', statusCode);

          ready = false;
          sock = null;
          initPromise = null;
          latestQr = null;

          /* ✅ logged out? — user نے WhatsApp سے device unlink کیا */
          if (statusCode === DisconnectReason.loggedOut) {
            clientState = 'logged_out';
            console.warn(
              '[whatsapp] ⚠️ logged out — .baileys-auth فولڈر delete کریں اور دوبارہ کوشش کریں'
            );
            reject(new Error('WhatsApp logged out'));
            return;
          }

          /* ✅ باقی سب صورتوں میں دوبارہ کوشش کریں */
          clientState = 'connecting';
          console.log('[whatsapp] reconnecting in 2s...');

          setTimeout(() => {
            initClient().catch(() => {});
          }, 2000);
        }
      });

      /* ✅ اگر 60 سیکنڈ تک QR اسکین نہ ہو تو نیا بنائیں */
      sock.ev.on('connection.update', (update) => {
        if (update.qr) {
          /* نیا QR آ گیا — پرانا خودبخود replace */
        }
      });
    } catch (err) {
      console.error('[whatsapp] init error:', err);
      ready = false;
      sock = null;
      initPromise = null;
      clientState = 'idle';
      reject(err);
    }
  });

  return initPromise;
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
    /* ✅ Init (اگر QR چاہیے تو) */
    await initClient();

    /* ✅ اگر QR اسکین نہیں ہوا → client ready نہیں */
    if (!sock || !ready) {
      return {
        success: false,
        error:
          'WhatsApp ابھی connect نہیں ہوا — QR اسکین کریں: http://localhost:3000/api/auth/whatsapp/qr',
        needsQr: true,
      };
    }

    const jid = phone.replace(/\D/g, '') + '@s.whatsapp.net';

    const message =
      `*ILMORA786 Verification Code*\n\n` +
      `Your OTP is: *${code}*\n\n` +
      `This code will expire in 5 minutes.\n` +
      `Do not share this code with anyone.`;

    await sock.sendMessage(jid, { text: message });
    console.log('[whatsapp] OTP sent to', phone);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[whatsapp] send failed:', msg);

    return {
      success: false,
      error: msg,
      needsQr: !ready,
    };
  }
}

/* ============================================================
   ✅ Optional: logout (Debugging کے لیے)
   ============================================================ */

export async function logoutWhatsApp(): Promise<void> {
  try {
    if (sock) {
      await sock.logout();
    }
  } catch {
    /* ignore */
  } finally {
    sock = null;
    ready = false;
    initPromise = null;
    latestQr = null;
    clientState = 'idle';
  }
}