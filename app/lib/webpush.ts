import webpush from 'web-push';
import connectDB from '@/app/lib/dbConnect';
import PushSubscription from '@/models/PushSubscription';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@example.com';

let initialized = false;

function ensureInit() {
  if (initialized) return;
  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    console.warn('[webpush] VAPID keys not configured');
    return;
  }
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
  initialized = true;
}

export type PushPayload = {
  title: string;
  body: string;
  /* کہاں کلک کرنے پر جانا ہے */
  url?: string;
  /* notification کا unique tag (replace existing) */
  tag?: string;
  /* Icon */
  icon?: string;
  badge?: string;
  /* Sound play کرنی ہے؟ */
  sound?: boolean;
  /* App icon badge count */
  badgeCount?: number;
  /* Notification type (chat/class/call) */
  type?: 'chat' | 'class' | 'call' | 'general';
  /* Extra data */
  data?: Record<string, any>;
};

/* ============================================================
   ایک user کو push بھیجیں
   ============================================================ */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  ensureInit();
  if (!initialized) return { sent: 0, failed: 0 };

  await connectDB();

  const subs: any[] = await PushSubscription.find({ userId }).lean();
  if (subs.length === 0) return { sent: 0, failed: 0 };

  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          body,
          {
            TTL: 60 * 60 * 24, // 24 hours
            urgency: payload.type === 'call' ? 'high' : 'normal',
          }
        );
        sent++;
      } catch (err: any) {
        failed++;
        /* 404/410 = subscription expired → delete */
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          try {
            await PushSubscription.deleteOne({ _id: sub._id });
          } catch {}
        }
      }
    })
  );

  return { sent, failed };
}

/* ============================================================
   ایک سے زیادہ users کو
   ============================================================ */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const results = await Promise.all(
    userIds.map((id) => sendPushToUser(id, payload))
  );
  return results.reduce(
    (acc, r) => ({
      sent: acc.sent + r.sent,
      failed: acc.failed + r.failed,
    }),
    { sent: 0, failed: 0 }
  );
}