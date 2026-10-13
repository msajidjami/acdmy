/* eslint-disable @typescript-eslint/no-explicit-any */
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  type WASocket,
} from '@whiskeysockets/baileys';
import { useMongoAuthState } from './authState';

/* ============================================================
   Silent logger
   ============================================================ */

const silentLogger: any = {
  level: 'silent',
  fatal: () => {},
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
  trace: () => {},
  child: () => silentLogger,
};

/* ============================================================
   Types
   ============================================================ */

type Status = 'connecting' | 'qr' | 'connected' | 'disconnected' | 'error';

interface State {
  qr: string | null;
  status: Status;
  phoneNumber: string | null;
  lastConnected: string | null;
  error: string | null;
  sock: WASocket | null;
  starting: boolean;
}

const FALLBACK_VERSION: [number, number, number] = [2, 3000, 1023222];

/* ============================================================
   Manager
   ============================================================ */

class WhatsAppManager {
  public state: State = {
    qr: null,
    status: 'disconnected',
    phoneNumber: null,
    lastConnected: null,
    error: null,
    sock: null,
    starting: false,
  };

  /* ✅ Socket کی unique ID — پرانے sockets کے events ignore کرنے کے لیے */
  private currentSocketId = 0;

  getStatus() {
    return {
      qr: this.state.qr,
      status: this.state.status,
      phoneNumber: this.state.phoneNumber,
      lastConnected: this.state.lastConnected,
      error: this.state.error,
      ready: this.state.status === 'connected',
    };
  }

  getSock(): WASocket | null {
    return this.state.sock;
  }

  /* ============================================================
     ✅ Kill existing socket (properly)
     ============================================================ */
  private async killExistingSocket(): Promise<void> {
    const old = this.state.sock;
    if (!old) return;

    this.state.sock = null;

    try {
      old.ev.removeAllListeners('connection.update');
      old.ev.removeAllListeners('creds.update');
    } catch {}

    try {
      old.end(undefined);
    } catch {}

    /* تھوڑا انتظار تاکہ بند ہو جائے */
    await new Promise((r) => setTimeout(r, 500));
  }

  /* ============================================================
     Start
     ============================================================ */
  async start(): Promise<void> {
    /* ✅ اگر starting ہے تو انتظار کریں */
    if (this.state.starting) {
      return;
    }

    /* ✅ اگر connected ہے تو کچھ نہ کریں */
    if (this.state.sock && this.state.status === 'connected') {
      return;
    }

    this.state.starting = true;
    this.state.status = 'connecting';
    this.state.error = null;

    /* ✅ پرانے socket کو مکمل بند کریں */
    await this.killExistingSocket();

    /* ✅ نیا socket ID */
    const myId = ++this.currentSocketId;

    try {
      const { state, saveCreds } = await useMongoAuthState();

      /* WhatsApp version */
      let version: [number, number, number] = FALLBACK_VERSION;
      try {
        const v = await fetchLatestBaileysVersion();
        if (v?.version) {
          version = v.version as [number, number, number];
        }
      } catch {}

      console.log('[whatsapp] creating new socket (id:', myId, ')');

      const sock = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, silentLogger),
        },
        version,
        logger: silentLogger,
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'),
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
        connectTimeoutMs: 60_000,
        defaultQueryTimeoutMs: 60_000,
        keepAliveIntervalMs: 25_000,
        retryRequestDelayMs: 250,
      });

      /* ✅ state میں رکھیں — لیکن صرف اگر یہ موجودہ ہے */
      if (this.currentSocketId !== myId) {
        /* کوئی نیا socket پہلے ہی بن گیا — یہ ضائع */
        try {
          sock.end(undefined);
        } catch {}
        return;
      }

      this.state.sock = sock;

      /* ============================================================
         Connection updates — ✅ ignore stale socket events
         ============================================================ */
      sock.ev.on('connection.update', (update: any) => {
        /* ✅ یہ پرانا socket ہے؟ → ignore */
        if (this.currentSocketId !== myId) {
          return;
        }
        if (this.state.sock !== sock) {
          return;
        }

        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.state.qr = qr;
          this.state.status = 'qr';
          console.log('[whatsapp] QR ready (id:', myId, ')');
        }

        if (connection === 'open') {
          this.state.status = 'connected';
          this.state.qr = null;
          this.state.lastConnected = new Date().toISOString();

          const u = sock.user;
          if (u?.id) {
            const num = String(u.id).split(':')[0].split('@')[0];
            this.state.phoneNumber = num;
          }
          console.log(
            '[whatsapp] ✅ connected as',
            this.state.phoneNumber || 'unknown',
            '(id:',
            myId,
            ')'
          );
        }

        if (connection === 'connecting') {
          this.state.status = 'connecting';
        }

        if (connection === 'close') {
          const code = (lastDisconnect?.error as any)?.output?.statusCode;

          console.log(
            '[whatsapp] close, code:',
            code,
            '(id:',
            myId,
            ')'
          );

          /* ✅ صرف موجودہ socket کے لیے handle کریں */
          this.state.sock = null;
          this.state.qr = null;
          this.state.status = 'disconnected';

          /* ✅ 440 (connectionReplaced) — reconnect نہ کریں */
          if (code === DisconnectReason.connectionReplaced) {
            console.warn(
              '[whatsapp] ⚠️ connectionReplaced — will NOT auto-reconnect'
            );
            this.state.error =
              'Connection replaced by another session';
            return;
          }

          /* ✅ logged out — reconnect نہ کریں */
          if (code === DisconnectReason.loggedOut) {
            this.state.phoneNumber = null;
            console.warn('[whatsapp] logged out by user');
            return;
          }

          /* ✅ 401, 428, 405, 503 پر دیر سے reconnect */
          const delay =
            code === 405 || code === 428 || code === 503 || code === 401
              ? 15_000
              : 3_000;

          console.log(
            `[whatsapp] reconnecting in ${delay / 1000}s...`
          );

          setTimeout(() => {
            /* صرف اگر اب بھی کوئی نیا socket موجود نہ ہو */
            if (this.currentSocketId === myId && !this.state.sock) {
              void this.start();
            }
          }, delay);
        }
      });

      sock.ev.on('creds.update', saveCreds);
    } catch (err: any) {
      console.error('[whatsapp] start failed:', err);
      if (this.currentSocketId === myId) {
        this.state.status = 'error';
        this.state.error = err?.message || 'Failed to start';
      }
    } finally {
      if (this.currentSocketId === myId) {
        this.state.starting = false;
      }
    }
  }

  /* ============================================================
     Logout
     ============================================================ */
  async logout(): Promise<void> {
    /* نیا socket ID — تاکہ پرانے events ignore ہوں */
    this.currentSocketId++;

    const sock = this.state.sock;
    this.state.sock = null;

    if (sock) {
      try {
        sock.ev.removeAllListeners('connection.update');
        sock.ev.removeAllListeners('creds.update');
      } catch {}

      try {
        await sock.logout();
      } catch {}
    }

    this.state.qr = null;
    this.state.status = 'disconnected';
    this.state.phoneNumber = null;
    this.state.lastConnected = null;
    this.state.error = null;
  }
}

/* ============================================================
   Singleton
   ============================================================ */

declare global {
  // eslint-disable-next-line no-var
  var __whatsappManager: WhatsAppManager | undefined;
}

export function getWhatsAppManager(): WhatsAppManager {
  if (!global.__whatsappManager) {
    global.__whatsappManager = new WhatsAppManager();
  }
  return global.__whatsappManager;
}